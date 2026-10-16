(() => {
"use strict";
const $ = (id) => document.getElementById(id);
const DEFAULT_API_URL = $("api-url").value;

// localStorage can be unavailable (private mode, blocked storage): fall back to memory.
const memory = {};
const store = {
	get(k) { try { return localStorage.getItem(k) ?? memory[k] ?? null; } catch { return memory[k] ?? null; } },
	set(k, v) { memory[k] = v; try { localStorage.setItem(k, v); } catch {} },
	remove(k) { delete memory[k]; try { localStorage.removeItem(k); } catch {} },
};

function showMsg(id, text, kind = "") {
	const el = $(id);
	el.textContent = text;
	el.className = "msg " + kind;
}

// --- Signing ---------------------------------------------------------------------------------------
// Must match canonicalRequest() in the grader worker's src/auth.ts:
//   METHOD \n /path?query \n unix-seconds \n hex(sha256(body))   signed with ECDSA P-256 / SHA-256.

const KEY_STORAGE = "grader.adminKey";
const PKCS8_RE = /-----BEGIN PRIVATE KEY-----[\s\S]+?-----END PRIVATE KEY-----/;

const b64ToBytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const bytesToB64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const pemToDer = (pem) => b64ToBytes(pem.replace(/-----[^-]+-----|\s/g, ""));
const hex = (bytes) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");

let signingKey = null;   // CryptoKey, non-extractable

async function loadKey(pem) {
	signingKey = await crypto.subtle.importKey("pkcs8", pemToDer(pem), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
}

/** Base64 SPKI of the public half, the same string scripts/admin-keys.sh stores in keys/<name>.pub. */
async function publicKeyOf(pem) {
	const extractable = await crypto.subtle.importKey("pkcs8", pemToDer(pem), { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
	const { kty, crv, x, y } = await crypto.subtle.exportKey("jwk", extractable);
	const pub = await crypto.subtle.importKey("jwk", { kty, crv, x, y }, { name: "ECDSA", namedCurve: "P-256" }, true, ["verify"]);
	return bytesToB64(await crypto.subtle.exportKey("spki", pub));
}

async function signatureHeaders(method, path, bodyText) {
	await keyReady;
	if (!signingKey) throw new Error("Upload an admin private key first.");
	const timestamp = String(Math.floor(Date.now() / 1000));
	const bodyHash = hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(bodyText ?? "")));
	const message = new TextEncoder().encode(`${method}\n${path}\n${timestamp}\n${bodyHash}`);
	const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, signingKey, message);
	return { "X-Grader-Timestamp": timestamp, "X-Grader-Signature": bytesToB64(signature) };
}

// --- API ---------------------------------------------------------------------------------------------

function apiBase() {
	return ($("api-url").value.trim() || DEFAULT_API_URL).replace(/\/+$/, "");
}

async function api(method, path, body, { admin = true } = {}) {
	const bodyText = body === undefined ? undefined : JSON.stringify(body);
	const url = new URL(apiBase() + path);
	if (!["https:", "http:"].includes(url.protocol)) throw new Error("Use an HTTP or HTTPS API URL.");
	const headers = { ...(bodyText ? { "Content-Type": "application/json" } : {}), ...(admin ? await signatureHeaders(method, url.pathname + url.search, bodyText) : {}) };

	let res;
	try {
		res = await fetch(url.href, { method, headers, body: bodyText });
	} catch {
		throw new Error(`Couldn't reach ${apiBase()}. Check the URL, and that this page's origin (${location.origin}) is in the worker's ALLOWED_ORIGINS.`);
	}

	const text = await res.text();
	let data;
	try { data = JSON.parse(text); } catch { data = { error: text || "(empty response)" }; }
	if (!res.ok) {
		const hint = res.status === 403 && admin ? " (this key isn't authorized: run scripts/admin-keys.sh push)" : "";
		throw new Error(`${res.status}: ${data.error ?? text}${hint}`);
	}
	return data;
}

/** Run an async action with its button disabled, reporting errors in the given message line. */
async function run(button, msgId, action) {
	button.disabled = true;
	showMsg(msgId, "Working…");
	try { await action(); }
	catch (e) { showMsg(msgId, e.message, "error"); }
	finally { button.disabled = false; }
}

// --- API URL -----------------------------------------------------------------------------------------

$("api-url").value = store.get("grader.apiUrl") ?? DEFAULT_API_URL;
$("api-url").addEventListener("change", (e) => store.set("grader.apiUrl", e.target.value.trim()));

// --- Admin key ---------------------------------------------------------------------------------------

async function renderKey() {
	const pem = store.get(KEY_STORAGE);
	$("key-state").textContent = signingKey ? "loaded" : "missing";
	$("key-state").dataset.ready = String(Boolean(signingKey));
	$("key-public").textContent = pem ? (await publicKeyOf(pem).catch(() => "unreadable")).slice(0, 48) + "…" : "—";
}

$("key-upload").addEventListener("click", () => $("key-file").click());

$("key-file").addEventListener("change", async (e) => {
	const file = e.target.files[0];
	e.target.value = "";
	if (!file) return;
	const text = await file.text();
	const pem = text.match(PKCS8_RE)?.[0];
	if (!pem) {
		const hint = /BEGIN (EC |ENCRYPTED )PRIVATE KEY/.test(text) ? " This key is in a different format; use one made by scripts/admin-keys.sh." : "";
		return showMsg("key-msg", `No PKCS#8 private key ("BEGIN PRIVATE KEY") in ${file.name}.${hint}`, "error");
	}
	try {
		await loadKey(pem);
	} catch {
		return showMsg("key-msg", `${file.name} is not an ECDSA P-256 private key.`, "error");
	}
	store.set(KEY_STORAGE, pem);
	await renderKey();
	showMsg("key-msg", `Saved ${file.name}.`, "ok");
});

$("key-clear").addEventListener("click", async () => {
	if (!confirm("Remove the stored admin key from this browser?")) return;
	store.remove(KEY_STORAGE);
	signingKey = null;
	await renderKey();
	showMsg("key-msg", "Removed.", "ok");
});

const keyReady = (async () => {
	const pem = store.get(KEY_STORAGE);
	if (pem) await loadKey(pem).catch(() => showMsg("key-msg", "The stored key couldn't be loaded; upload it again.", "error"));
	await renderKey();
})();

async function copy(text, button) {
	try {
		await navigator.clipboard.writeText(text);
		const label = button.textContent;
		button.textContent = "Copied";
		setTimeout(() => (button.textContent = label), 1200);
	} catch {
		prompt("Copy manually:", text);
	}
}

// --- Webhook setup instructions --------------------------------------------------------------------

/** What the student enters in GitHub → Settings → Webhooks → Add webhook, plus the equivalent `gh` command. */
function renderWebhookSetup(container, { repo_ssh_url, webhook_url, webhook_secret }) {
	const el = (tag, props = {}, ...children) => {
		const e = Object.assign(document.createElement(tag), props);
		e.append(...children);
		return e;
	};
	const copyButton = (text) => {
		const b = el("button", { type: "button", className: "secondary small", textContent: "Copy" });
		b.addEventListener("click", () => copy(text, b));
		return b;
	};

	const dl = el("dl", { className: "key-status setup" });
	for (const [label, value, copyable] of [
		["Payload URL", webhook_url, true],
		["Content type", "application/json", false],
		["Secret", webhook_secret, true],
		["Events", "Just the push event", false],
	]) {
		dl.append(el("dt", { textContent: label }), el("dd", {}, el("code", { textContent: value }), ...(copyable ? [copyButton(value)] : [])));
	}

	const parts = [el("h3", { textContent: "Push webhook (GitHub → Settings → Webhooks → Add webhook)" }), dl];
	const github = /^git@github\.com:(.+)\.git$/.exec(repo_ssh_url ?? "");
	if (github) {
		const command = `gh api repos/${github[1]}/hooks -f name=web -F active=true -f 'events[]=push' ` +
			`-f 'config[url]=${webhook_url}' -f 'config[content_type]=json' -f 'config[secret]=${webhook_secret}'`;
		parts.push(
			el("div", { className: "row", style: "margin-top: 10px; justify-content: space-between; align-items: center" },
				el("span", { className: "muted", textContent: "Or, with the GitHub CLI:" }), copyButton(command)),
			el("pre", { textContent: command }),
		);
	}
	container.replaceChildren(...parts);
}

// --- Submissions -------------------------------------------------------------------------------------

let lastFilter = {};   // body for POST /submissions: assignment_name, pushed_after, order_by

async function loadSubmissions() {
	const { submissions } = await api("POST", "/submissions", lastFilter);
	renderSubmissions(submissions);
	const parts = [];
	if (lastFilter.assignment_name) parts.push(`for "${lastFilter.assignment_name}"`);
	if (lastFilter.pushed_after) parts.push(`pushed after ${new Date(lastFilter.pushed_after).toLocaleString()}`);
	showMsg("list-msg", `${submissions.length} submission${submissions.length === 1 ? "" : "s"} ${parts.join(", ")}`.trim(), "ok");
}

function cell(tr, text, cls) {
	const td = tr.insertCell();
	td.textContent = text ?? "";   // student-supplied data: never use innerHTML
	if (cls) td.className = cls;
	return td;
}

function renderSubmissions(rows, tbody = $("list-body"), wrap = $("list-wrap")) {
	tbody.replaceChildren();
	for (const s of rows) {
		const tr = tbody.insertRow();
		cell(tr, s.assignment_name);
		cell(tr, String(s.student_id));
		cell(tr, s.email);
		cell(tr, s.repo_url).title = s.repo_ssh_url;
		cell(tr, new Date(s.created_at).toLocaleString());
		cell(tr, s.webhook_seen_at ? new Date(s.webhook_seen_at).toLocaleString() : "never", s.webhook_seen_at ? "" : "muted");
		const push = cell(tr, s.last_push ? new Date(s.last_push).toLocaleString() : "—", s.last_push ? "" : "muted");
		if (s.last_commit) push.append(document.createElement("br"), Object.assign(document.createElement("code"), { textContent: s.last_commit.slice(0, 7), title: s.last_commit }));
		cell(tr, s.id, "mono");

		const actions = cell(tr, "", "actions");
		const copyKey = Object.assign(document.createElement("button"), { type: "button", className: "secondary small", textContent: "Copy private key" });
		copyKey.addEventListener("click", () => copy(s.private_key, copyKey));
		const del = Object.assign(document.createElement("button"), { type: "button", className: "danger small", textContent: "Delete" });
		del.addEventListener("click", () => {
			if (!confirm(`Delete the submission of ${s.student_id} (${s.repo_url}) for "${s.assignment_name}"?`)) return;
			run(del, "list-msg", async () => {
				await api("DELETE", "/submissions", { id: s.id });
				tr.remove();
				await loadSubmissions();
			});
		});
		const rotate = Object.assign(document.createElement("button"), { type: "button", className: "secondary small", textContent: "New webhook secret" });
		rotate.addEventListener("click", () => {
			if (!confirm(`Replace the webhook secret of ${s.repo_url}? The student's current webhook stops working until they enter the new secret.`)) return;
			run(rotate, "list-msg", async () => {
				const data = await api("POST", "/webhook-secret", { id: s.id });
				$("rotate-title").textContent = `New webhook secret for ${s.repo_url} (student ${s.student_id})`;
				renderWebhookSetup($("rotate-webhook"), { ...data, repo_ssh_url: s.repo_ssh_url });
				$("rotate-result").hidden = false;
				showMsg("list-msg", "Webhook secret replaced. Send the student the new secret below.", "ok");
				$("rotate-result").scrollIntoView({ behavior: "smooth", block: "nearest" });
			});
		});
		const group = document.createElement("div");
		group.append(copyKey, rotate, del);
		actions.append(group);
	}
	wrap.hidden = rows.length === 0;
	$("list-empty").hidden = rows.length > 0;
	$("list-note").hidden = rows.length === 0;
	$("list-empty-title").textContent = "No submissions found";
	$("list-empty-hint").textContent = "Try another assignment or an earlier push time.";
}

$("list-form").addEventListener("submit", (e) => {
	e.preventDefault();
	const f = new FormData(e.target);
	const pushedAfter = f.get("pushed_after");
	lastFilter = {
		...(f.get("assignment_name").trim() && { assignment_name: f.get("assignment_name").trim() }),
		// datetime-local has no timezone: interpret it in the browser's zone and send an unambiguous UTC instant.
		...(pushedAfter && { pushed_after: new Date(pushedAfter).toISOString() }),
		order_by: f.get("order_by"),
	};
	run(e.submitter, "list-msg", loadSubmissions);
});

// --- Delete assignment -------------------------------------------------------------------------------

$("delete-assignment-form").addEventListener("submit", (e) => {
	e.preventDefault();
	const name = new FormData(e.target).get("assignment_name").trim();
	if (!confirm(`Delete ALL submissions of "${name}"? This can't be undone.`)) return;
	run(e.submitter, "delete-assignment-msg", async () => {
		const { deleted } = await api("DELETE", "/assignment", { assignment_name: name });
		showMsg("delete-assignment-msg", `Deleted ${deleted} submission${deleted === 1 ? "" : "s"}.`, "ok");
		$("rotate-result").hidden = true;
		await run($("list-form").querySelector("button"), "list-msg", loadSubmissions);
	});
});
})();
