const MIN_HISTOGRAM_BINS = 50;
const MIN_RANGE_STEP_MS = 15;

const getMedalCutoffs = (count) => {
    if (count < 10) return null;
    const gold = Math.max(1, Math.round(count * 0.05));
    const silver = Math.max(gold + 1, Math.round(count * 0.10));
    const bronze = Math.max(silver + 1, Math.round(count * 0.20));
    return { gold, silver, bronze };
};

const awardTaskMedals = (container) => {
    const rows = container.querySelectorAll('tbody tr');
    // Every submission counts toward the cutoffs; only correct results earn medals.
    const cutoffs = getMedalCutoffs(rows.length);
    let rank = 0;
    rows.forEach(row => {
        const badge = row.querySelector('.leaderboard-rank-badge');
        const medal = row.querySelector('.leaderboard-medal');
        delete badge.dataset.medal;
        badge.removeAttribute('tabindex');
        badge.removeAttribute('title');
        medal.classList.add('hidden');
        medal.removeAttribute('title');
        medal.removeAttribute('aria-label');
        if (!cutoffs || row.dataset.status !== 'graded') return;
        rank += 1;
        const tier = rank <= cutoffs.gold ? 'gold'
            : rank <= cutoffs.silver ? 'silver'
            : rank <= cutoffs.bronze ? 'bronze' : null;
        if (!tier) return;
        const label = `${tier[0].toUpperCase()}${tier.slice(1)} medal`;
        badge.dataset.medal = tier;
        badge.tabIndex = 0;
        medal.setAttribute('aria-label', label);
        medal.classList.remove('hidden');
    });
};

const setupMedalTooltip = () => {
    const tooltip = document.createElement('div');
    tooltip.id = 'medal-tooltip';
    tooltip.className = 'medal-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.innerHTML = `
        <p class="medal-tooltip-heading">Medals are awarded as follows:</p>
        <div class="medal-tooltip-formula">
            <span class="medal-tooltip-circle" data-medal="gold" role="img" aria-label="Gold cutoff"></span>
            <code>G = max(1, round(5% × N))</code>
        </div>
        <div class="medal-tooltip-formula">
            <span class="medal-tooltip-circle" data-medal="silver" role="img" aria-label="Silver cutoff"></span>
            <code>S = max(G + 1, round(10% × N))</code>
        </div>
        <div class="medal-tooltip-formula">
            <span class="medal-tooltip-circle" data-medal="bronze" role="img" aria-label="Bronze cutoff"></span>
            <code>B = max(S + 1, round(20% × N))</code>
        </div>
        <hr class="medal-tooltip-separator">
        <p class="medal-tooltip-note">N = all submissions, correct + incorrect.</p>
        <p class="medal-tooltip-note">Only correct results earn medals.</p>
    `;
    tooltip.hidden = true;
    document.body.append(tooltip);
    let activeBadge = null;
    let hideTimer;
    const hide = () => {
        clearTimeout(hideTimer);
        tooltip.hidden = true;
        activeBadge?.removeAttribute('aria-describedby');
        activeBadge = null;
    };
    const scheduleHide = () => {
        hideTimer = setTimeout(hide, 150);
    };
    const show = (badge) => {
        hide();
        activeBadge = badge;
        tooltip.hidden = false;
        badge.setAttribute('aria-describedby', tooltip.id);
        const rect = badge.getBoundingClientRect();
        const width = tooltip.offsetWidth;
        const height = tooltip.offsetHeight;
        const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
        const top = rect.bottom + height + 8 <= window.innerHeight - 12
            ? rect.bottom + 8 : Math.max(12, rect.top - height - 8);
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    };
    document.querySelectorAll('.leaderboard-rank-badge[data-medal]').forEach(badge => {
        badge.addEventListener('mouseenter', () => show(badge));
        badge.addEventListener('mouseleave', scheduleHide);
        badge.addEventListener('focus', () => show(badge));
        badge.addEventListener('blur', hide);
    });
    tooltip.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    tooltip.addEventListener('mouseleave', scheduleHide);
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') hide();
    });
    document.addEventListener('scroll', event => {
        if (!tooltip.contains(event.target)) hide();
    }, true);
    document.addEventListener('click', hide);
    window.addEventListener('resize', hide);
};

// Log modal handlers
const modal = document.getElementById('log-modal');
const stdoutEl = document.getElementById('log-stdout');
const stderrEl = document.getElementById('log-stderr');

const prettyPrint = (text) => {
    if (!text) return '';
    // If the string is wrapped in quotes (JSON stringified), try parsing it first
    if (text.startsWith('"') && text.endsWith('"')) {
        try {
            return JSON.parse(text);
        } catch (e) {
            // If parsing fails, fall through to manual regex
        }
    }

    // Manual replace: turns literal "\\n" into an actual new line
    return text.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
};

window.showLog = (stdout, stderr) => {
    stdoutEl.value = prettyPrint(stdout) || '';
    stderrEl.value = prettyPrint(stderr) || '';
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.closeLog = () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
};

modal?.addEventListener('click', closeLog);

// Highlight user row if student ID is saved
const highlightUserRow = () => {
    const savedStudentId = localStorage.getItem('student-id');
    const scrollBtn = document.getElementById('scroll-to-user-btn');
    
    if (!savedStudentId) {
        if (scrollBtn) scrollBtn.classList.add('hidden');
        return;
    }

    // Show the scroll button since student ID is set
    if (scrollBtn) scrollBtn.classList.remove('hidden');

    const rows = document.querySelectorAll('.leaderboard-task:not(.hidden) table tbody tr');
    rows.forEach(row => {
        const studentCell = row.querySelector('td:nth-child(3)');
        if (studentCell && studentCell.textContent.trim() === savedStudentId) {
            row.classList.add('bg-yellow-100');
        } else {
            row.classList.remove('bg-yellow-100');
        }
    });
};

window.highlightUserRow = highlightUserRow;

window.scrollToUserRow = () => {
    const savedStudentId = localStorage.getItem('student-id');
    if (!savedStudentId) return;

    const rows = document.querySelectorAll('.leaderboard-task:not(.hidden) table tbody tr');
    for (let row of rows) {
        const studentCell = row.querySelector('td:nth-child(3)');
        if (studentCell && studentCell.textContent.trim() === savedStudentId) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            break;
        }
    }
};

const computeMedian = (arr) => {
    if (!arr.length) return null;
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
};

const computeQuartiles = (values) => {
    if (!values.length) return { q1: null, median: null, q3: null };
    const sorted = [...values].sort((a, b) => a - b);
    const median = computeMedian(sorted);
    const mid = Math.floor(sorted.length / 2);
    const lower = sorted.slice(0, mid);
    const upper = sorted.length % 2 === 0 ? sorted.slice(mid) : sorted.slice(mid + 1);
    const q1 = computeMedian(lower);
    const q3 = computeMedian(upper);
    return { q1, median, q3 };
};

const getLeaderboardStorageKey = (container, suffix) => {
    const id = container?.id || 'leaderboard';
    return `leaderboard:${id}:${suffix}`;
};

const initRangeControls = (container, values) => {
    const minInput = container.querySelector('.runtime-range-min');
    const maxInput = container.querySelector('.runtime-range-max');
    const minNumber = container.querySelector('.runtime-range-min-input');
    const maxNumber = container.querySelector('.runtime-range-max-input');

    if (!minInput || !maxInput || !minNumber || !maxNumber) return null;

    if (!values.length) {
        minInput.disabled = true;
        maxInput.disabled = true;
        minNumber.disabled = true;
        maxNumber.disabled = true;
        return null;
    }

    const overallMin = Math.min(...values);
    const overallMax = Math.max(...values);
    container.dataset.rangeOverallMin = String(overallMin);
    container.dataset.rangeOverallMax = String(overallMax);

    const snapToStep = (val) => {
        const snapped = Math.round(val / MIN_RANGE_STEP_MS) * MIN_RANGE_STEP_MS;
        return Math.max(overallMin, Math.min(snapped, overallMax));
    };

    if (!container.dataset.rangeInit) {
        minInput.min = String(overallMin);
        minInput.max = String(overallMax);
        maxInput.min = String(overallMin);
        maxInput.max = String(overallMax);
        minNumber.min = String(overallMin);
        minNumber.max = String(overallMax);
        maxNumber.min = String(overallMin);
        maxNumber.max = String(overallMax);

        minInput.step = String(MIN_RANGE_STEP_MS);
        maxInput.step = String(MIN_RANGE_STEP_MS);
        minNumber.step = 'any';
        maxNumber.step = 'any';

        const storedMin = parseFloat(localStorage.getItem(getLeaderboardStorageKey(container, 'range:min')));
        const storedMax = parseFloat(localStorage.getItem(getLeaderboardStorageKey(container, 'range:max')));
        const hasStoredMin = !Number.isNaN(storedMin);
        const hasStoredMax = !Number.isNaN(storedMax);

        const initialMin = hasStoredMin ? storedMin : overallMin;
        const initialMax = hasStoredMax ? storedMax : overallMax;
        const rawMin = Math.max(overallMin, Math.min(initialMin, overallMax));
        const rawMax = Math.max(overallMin, Math.min(initialMax, overallMax));

        container.dataset.rangeMinValue = String(rawMin);
        container.dataset.rangeMaxValue = String(rawMax);

        minInput.value = String(snapToStep(rawMin));
        maxInput.value = String(snapToStep(rawMax));
        minNumber.value = String(rawMin);
        maxNumber.value = String(rawMax);

        const handleRangeInput = (source) => {
            let minVal = parseFloat(source === 'number' ? minNumber.value : minInput.value);
            let maxVal = parseFloat(source === 'number' ? maxNumber.value : maxInput.value);

            if (Number.isNaN(minVal)) minVal = overallMin;
            if (Number.isNaN(maxVal)) maxVal = overallMax;

            minVal = Math.max(overallMin, Math.min(minVal, overallMax));
            maxVal = Math.max(overallMin, Math.min(maxVal, overallMax));

            if (minVal > maxVal) {
                const temp = minVal;
                minVal = maxVal;
                maxVal = temp;
            }

            if (source === 'range') {
                minVal = snapToStep(minVal);
                maxVal = snapToStep(maxVal);
            }

            container.dataset.rangeMinValue = String(minVal);
            container.dataset.rangeMaxValue = String(maxVal);

            if (source === 'range') {
                minInput.value = String(minVal);
                maxInput.value = String(maxVal);
                minNumber.value = String(minVal);
                maxNumber.value = String(maxVal);
            } else {
                minInput.value = String(snapToStep(minVal));
                maxInput.value = String(snapToStep(maxVal));
                minNumber.value = String(minVal);
                maxNumber.value = String(maxVal);
            }
            localStorage.setItem(getLeaderboardStorageKey(container, 'range:min'), String(minVal));
            localStorage.setItem(getLeaderboardStorageKey(container, 'range:max'), String(maxVal));
            renderRuntimeChart(container);
        };

        minInput.addEventListener('input', () => handleRangeInput('range'));
        maxInput.addEventListener('input', () => handleRangeInput('range'));
        minNumber.addEventListener('change', () => handleRangeInput('number'));
        maxNumber.addEventListener('change', () => handleRangeInput('number'));
        minNumber.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                handleRangeInput('number');
            }
        });
        maxNumber.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                handleRangeInput('number');
            }
        });
        container.dataset.rangeInit = 'true';
    }

    const storedMin = parseFloat(container.dataset.rangeMinValue ?? minNumber.value);
    const storedMax = parseFloat(container.dataset.rangeMaxValue ?? maxNumber.value);
    const minVal = Number.isNaN(storedMin) ? overallMin : storedMin;
    const maxVal = Number.isNaN(storedMax) ? overallMax : storedMax;

    minInput.value = String(snapToStep(minVal));
    maxInput.value = String(snapToStep(maxVal));
    minNumber.value = String(minVal);
    maxNumber.value = String(maxVal);
    return { min: minVal, max: maxVal };
};

const renderRuntimeChart = (container) => {
    if (!container) return;
    const raw = container.dataset.runtimes || '[]';
    let values = [];
    try {
        values = JSON.parse(raw).filter(v => typeof v === 'number' && !Number.isNaN(v));
    } catch (e) {
        values = [];
    }

    const panel = container.querySelector('.runtime-chart-panel');
    if (panel?.classList.contains('hidden')) return;

    const canvas = container.querySelector('canvas.runtime-chart');
    const q1El = container.querySelector('.runtime-q1');
    const medianEl = container.querySelector('.runtime-median');
    const q3El = container.querySelector('.runtime-q3');
    if (!canvas) return;

    const parent = canvas.parentElement;
    const width = parent?.clientWidth || 600;
    const height = parent?.clientHeight || 176;
    canvas.width = width;
    canvas.height = height + 10; // Extra space for x-axis labels

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const range = initRangeControls(container, values);
    const filtered = range ? values.filter(v => v >= range.min && v <= range.max) : values;

    const fmt = (num) => (num === null || num === undefined ? '-' : `${num.toFixed(2)} ms`);
    const { q1, median, q3 } = computeQuartiles(values);
    if (q1El) q1El.textContent = `Q1: ${fmt(q1)}`;
    if (medianEl) medianEl.textContent = `Median: ${fmt(median)}`;
    if (q3El) q3El.textContent = `Q3: ${fmt(q3)}`;

    if (!filtered.length) {
        ctx.fillStyle = '#9ca3af';
        ctx.font = '14px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No runtime data in range', width / 2, height / 2);
        return;
    }

    const min = range ? range.min : Math.min(...filtered);
    const max = range ? range.max : Math.max(...filtered);
    const bins = Math.max(MIN_HISTOGRAM_BINS, Math.ceil(Math.sqrt(filtered.length)));
    const counts = new Array(bins).fill(0);
    const span = max - min || 1;
    filtered.forEach(v => {
        const idx = Math.min(bins - 1, Math.floor(((v - min) / span) * bins));
        counts[idx] += 1;
    });

    const padding = { top: 16, right: 12, bottom: 28, left: 36 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const maxCount = Math.max(...counts, 1);
    const barGap = 6;
    const barWidth = Math.max(1, (chartWidth - barGap * (bins - 1)) / bins);

    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(padding.left, padding.top, chartWidth, chartHeight);

    ctx.strokeStyle = '#cbd5f5';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.stroke();

    counts.forEach((count, i) => {
        const barHeight = (count / maxCount) * chartHeight;
        const x = padding.left + i * (barWidth + barGap);
        const y = padding.top + (chartHeight - barHeight);
        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(x, y, barWidth, barHeight);
    });

    ctx.fillStyle = '#6b7280';
    ctx.font = '11px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('0', 4, padding.top + chartHeight + 4);
    ctx.textAlign = 'left';
    ctx.fillText(String(maxCount), 4, padding.top + 10);

    ctx.textAlign = 'center';
    ctx.fillText(`${min.toFixed(2)} ms`, padding.left, padding.top + chartHeight + 18);
    ctx.fillText(`${((min + max) / 2).toFixed(2)} ms`, padding.left + chartWidth / 2, padding.top + chartHeight + 18);
    ctx.fillText(`${max.toFixed(2)} ms`, padding.left + chartWidth, padding.top + chartHeight + 18);

    ctx.save();
    ctx.translate(12, padding.top + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Count', 0, 0);
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.fillText('Runtime (ms)', padding.left + chartWidth / 2, height + 6);
};

const setupChartToggle = (container) => {
    if (container.dataset.chartToggleInit) return;
    const toggleBtn = container.querySelector('.runtime-toggle-btn');
    const panel = container.querySelector('.runtime-chart-panel');
    if (!toggleBtn || !panel) return;

    const storageKey = getLeaderboardStorageKey(container, 'chart:visible');
    const storedVisible = localStorage.getItem(storageKey);
    const isVisible = storedVisible === 'true';
    panel.classList.toggle('hidden', !isVisible);

    const updateLabel = () => {
        toggleBtn.textContent = panel.classList.contains('hidden') ? 'Show chart' : 'Hide chart';
    };

    updateLabel();

    toggleBtn.addEventListener('click', () => {
        panel.classList.toggle('hidden');
        updateLabel();
        localStorage.setItem(storageKey, String(!panel.classList.contains('hidden')));
        if (!panel.classList.contains('hidden')) {
            renderRuntimeChart(container);
        }
    });

    container.dataset.chartToggleInit = 'true';
};

// API mode uses the same task and row markup as the file-backed leaderboard.
const loadAPILeaderboard = async () => {
    const config = document.getElementById('leaderboard-api');
    if (!config) return;

    const message = document.getElementById('leaderboard-message');
    try {
        const url = new URL(`${config.dataset.apiUrl.replace(/\/+$/, '')}/leaderboard`);
        url.searchParams.set('assignment_name', config.dataset.assignment);
        const response = await fetch(url, { credentials: 'omit', cache: 'no-store' });
        if (!response.ok) throw new Error(`Leaderboard request failed (${response.status})`);
        const payload = await response.json();
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            throw new Error('Invalid leaderboard response');
        }
        const entries = payload[config.dataset.assignment] ?? [];
        if (!Array.isArray(entries)) throw new Error('Invalid assignment leaderboard');
        const tasks = [...new Set(entries.flatMap(entry => entry.tasks || []))];
        if (!tasks.length) {
            message.textContent = 'No leaderboard data found.';
            return;
        }

        const select = document.getElementById('task-select');
        const standings = document.getElementById('leaderboard-standings');
        const taskTemplate = document.getElementById('leaderboard-task-template');
        const rowTemplate = document.getElementById('leaderboard-row-template');
        const statusStyles = {
            graded: ['bg-green-100 text-green-600', 'fa-solid fa-check', 'Graded'],
            timeout: ['bg-amber-100 text-amber-600', 'fa-solid fa-clock', 'Timeout'],
            error: ['bg-red-200 text-red-600', 'fa-solid fa-xmark', 'Error'],
            grading: ['bg-blue-100 text-blue-600', 'fa-solid fa-spinner fa-spin', 'Grading'],
            pending: ['bg-gray-100 text-gray-600', 'fa-solid fa-clock', 'Pending'],
        };

        tasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task;
            option.textContent = task;
            select.append(option);

            const container = taskTemplate.content.firstElementChild.cloneNode(true);
            container.id = 'leaderboard-' + task;
            container.dataset.task = task;
            const rows = entries.filter(entry => entry.tasks.includes(task));
            const completed = rows.filter(entry => entry.status?.[task] === 'graded');
            completed.sort((a, b) => (a.avg_runtime[task] - b.avg_runtime[task]) * (config.dataset.order === 'desc' ? -1 : 1));
            const other = rows.filter(entry => entry.status?.[task] !== 'graded');
            other.sort((a, b) => String(a.name).localeCompare(String(b.name)));
            container.dataset.runtimes = JSON.stringify(completed.map(entry => entry.avg_runtime[task]).filter(value => Number.isFinite(value) && value > 0));
            const reduction = rows.map(entry => entry.reduction?.[task]).filter(Boolean).pop();
            const metric = reduction === 'median' ? 'Median Runtime' : reduction === 'mean' ? 'Mean Runtime' : config.dataset.metric;
            container.querySelector('thead th:last-child').textContent = metric;
            const tbody = container.querySelector('tbody');

            [...completed, ...other].forEach((entry, index) => {
                const row = rowTemplate.content.querySelector('tr').cloneNode(true);
                row.removeAttribute('onclick');
                row.addEventListener('click', () => window.showLog(entry.stdout?.[task] || '', entry.error?.[task] || ''));
                const cells = row.querySelectorAll('td');
                const status = entry.status?.[task];
                row.dataset.status = status || '';
                row.dataset.submissionId = entry.submission_id || entry.id || '';
                row.dataset.baseScore = status === 'graded' ? String(entry.avg_runtime[task]) : '';
                const grading = entry.is_grading?.[task];
                const [color, icon, label] = statusStyles[grading ? 'grading' : status] || statusStyles.pending;
                const indicator = cells[0].firstElementChild;
                indicator.className = `${color} rounded-full w-7 h-7 flex items-center justify-center mx-auto`;
                indicator.title = grading && status ? 'Grading (previous result shown)' : label;
                indicator.setAttribute('aria-label', indicator.title);
                indicator.firstElementChild.className = icon;
                cells[1].querySelector('.leaderboard-rank-value').textContent = `#${index + 1}`;
                cells[2].querySelector('.leaderboard-username').textContent = entry.name;
                cells[2].querySelector('.leaderboard-grading-dot').classList.toggle('hidden', !grading);
                const commit = typeof entry.commit_hash === 'string' ? entry.commit_hash : entry.commit_hash?.[task];
                cells[3].firstElementChild.textContent = commit ? commit.slice(0, 7) : 'N/A';
                cells[4].firstElementChild.textContent = status === 'graded' ? `${entry.avg_runtime[task].toFixed(2)} ms` : '—';
                tbody.append(row);
            });
            standings.insertBefore(container, document.getElementById('log-modal'));
        });
        message.classList.add('hidden');
        standings.classList.remove('hidden');
    } catch (error) {
        console.error('Could not load leaderboard:', error);
        document.getElementById('leaderboard-standings').classList.add('hidden');
        message.textContent = 'Unable to load leaderboard. Please try reloading the page.';
    }
};

// Add task penalties to raw scores before initializing ranks, medals, and charts.
const loadLeaderboardPenalties = async () => {
    const message = document.getElementById('penalties-message');
    const containers = document.querySelectorAll('.leaderboard-task');
    if (!message || !containers.length) return;
    message.textContent = 'Loading penalties to calculate final scores…';
    message.hidden = false;
    try {
        const url = new URL(`${message.dataset.apiUrl.replace(/\/+$/, '')}/penalties`);
        url.searchParams.set('assignment_name', message.dataset.assignment);
        const response = await fetch(url, { credentials: 'omit', cache: 'no-store' });
        if (!response.ok) throw new Error(`Penalties request failed (${response.status})`);
        const payload = await response.json();
        if (!Array.isArray(payload?.penalties)) throw new Error('Invalid penalties response');
        const penalties = new Map();
        for (const penalty of payload.penalties) {
            if (typeof penalty.id !== 'string' || typeof penalty.task !== 'string' ||
                !Number.isFinite(penalty.amount) || penalty.amount < 0 ||
                (penalty.description !== null && typeof penalty.description !== 'string')) {
                throw new Error('Invalid penalty');
            }
            const id = penalty.id.toLowerCase();
            if (!penalties.has(id)) penalties.set(id, new Map());
            penalties.get(id).set(penalty.task, penalty);
        }
        // Validate all totals before changing the displayed standings.
        containers.forEach(container => {
            container.querySelectorAll('tbody tr[data-status="graded"]').forEach(row => {
                const penalty = penalties.get(row.dataset.submissionId?.toLowerCase())?.get(container.dataset.task);
                if (!Number.isFinite(Number(row.dataset.baseScore) + (penalty?.amount ?? 0))) {
                    throw new Error('Invalid adjusted score');
                }
            });
        });
        let missingIdentity = false;
        containers.forEach(container => {
            let hasPenalty = false;
            container.querySelectorAll('tbody tr').forEach(row => {
                const id = row.dataset.submissionId?.toLowerCase();
                if (!id) missingIdentity = true;
                const penalty = penalties.get(id)?.get(container.dataset.task);
                row.querySelector('.leaderboard-penalty')?.remove();
                if (row.dataset.status === 'graded') {
                    const base = Number(row.dataset.baseScore);
                    const total = base + (penalty?.amount ?? 0);
                    row.dataset.score = String(total);
                    const score = row.querySelector('td:last-child > span');
                    score.textContent = `${total.toFixed(2)} ms`;
                    score.title = penalty ? `Runtime: ${base} ms + penalty: ${penalty.amount} ms` : `Runtime: ${base} ms`;
                }
                if (!penalty) return;
                hasPenalty = true;
                const badge = document.createElement('button');
                badge.type = 'button';
                badge.className = 'leaderboard-penalty';
                const icon = document.createElement('i');
                icon.className = 'fa-solid fa-triangle-exclamation';
                icon.setAttribute('aria-hidden', 'true');
                badge.append(icon);
                badge.setAttribute('aria-label', `Penalty: ${penalty.amount} ms. ${penalty.description || 'No description provided.'}`);
                badge.dataset.description = `Penalty: +${penalty.amount} ms\n${penalty.description || 'No description provided.'}`;
                badge.addEventListener('click', event => event.stopPropagation());
                row.querySelector('.leaderboard-username').parentElement.append(badge);
            });
            const tbody = container.querySelector('tbody');
            const rows = [...tbody.querySelectorAll('tr')];
            rows.sort((a, b) => {
                const aGraded = a.dataset.status === 'graded';
                const bGraded = b.dataset.status === 'graded';
                if (aGraded !== bGraded) return aGraded ? -1 : 1;
                if (!aGraded) return 0; // Preserve the existing name order for unscored tasks.
                return (Number(a.dataset.score) - Number(b.dataset.score)) * (message.dataset.order === 'desc' ? -1 : 1);
            });
            rows.forEach((row, index) => {
                row.querySelector('.leaderboard-rank-value').textContent = `#${index + 1}`;
                tbody.append(row);
            });
            container.dataset.runtimes = JSON.stringify(rows.filter(row => row.dataset.status === 'graded')
                .map(row => Number(row.dataset.score)).filter(value => value >= 0));
            const heading = container.querySelector('thead th:last-child');
            heading.title = hasPenalty ? 'Runtime including task penalties (ms)' : '';
        });
        if (payload.penalties.length) {
            message.textContent = missingIdentity
                ? 'Scores include matched task penalties. Some entries have no submission UUID and cannot be matched, so their scores may exclude penalties.'
                : '';
            message.hidden = !missingIdentity;
        } else {
            message.hidden = true;
        }
    } catch (error) {
        console.error('Could not load penalties:', error);
        message.textContent = 'Penalty information is unavailable. Scores and rankings may exclude penalties. Please try reloading the page.';
        message.hidden = false;
    }
};

const setupPenaltyTooltip = () => {
    const badges = document.querySelectorAll('.leaderboard-penalty');
    if (!badges.length) return;
    const tooltip = document.createElement('div');
    tooltip.id = 'penalty-tooltip';
    tooltip.className = 'penalty-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.hidden = true;
    document.body.append(tooltip);
    let active = null;
    let hideTimer;
    const hide = () => {
        clearTimeout(hideTimer);
        tooltip.hidden = true;
        active?.removeAttribute('aria-describedby');
        active = null;
    };
    const scheduleHide = () => { hideTimer = setTimeout(hide, 150); };
    const show = (badge) => {
        hide();
        active = badge;
        tooltip.textContent = badge.dataset.description;
        tooltip.hidden = false;
        badge.setAttribute('aria-describedby', tooltip.id);
        const rect = badge.getBoundingClientRect();
        tooltip.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - tooltip.offsetWidth - 12))}px`;
        tooltip.style.top = `${rect.bottom + tooltip.offsetHeight + 8 <= window.innerHeight - 12
            ? rect.bottom + 8 : Math.max(12, rect.top - tooltip.offsetHeight - 8)}px`;
    };
    badges.forEach(badge => {
        badge.addEventListener('mouseenter', () => show(badge));
        badge.addEventListener('mouseleave', scheduleHide);
        badge.addEventListener('focus', () => show(badge));
        badge.addEventListener('blur', hide);
        badge.addEventListener('click', () => show(badge));
    });
    tooltip.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    tooltip.addEventListener('mouseleave', scheduleHide);
    document.addEventListener('click', hide);
    document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
    document.addEventListener('scroll', event => { if (!tooltip.contains(event.target)) hide(); }, true);
    window.addEventListener('resize', hide);
};

// Task dropdown handling
document.addEventListener('DOMContentLoaded', async () => {
    await loadAPILeaderboard();
    await loadLeaderboardPenalties();
    const select = document.getElementById('task-select');
    const containers = document.querySelectorAll('.leaderboard-task');
    containers.forEach(awardTaskMedals);
    setupMedalTooltip();
    setupPenaltyTooltip();

    const showTask = (task) => {
        containers.forEach(c => c.classList.add('hidden'));
        const active = document.getElementById('leaderboard-' + task);
        if (active) {
            active.classList.remove('hidden');
            window.highlightUserRow?.();
            setupChartToggle(active);
            renderRuntimeChart(active);
        }
        const params = new URLSearchParams(window.location.search);
        params.set('task', task);
        const newUrl = window.location.pathname + '?' + params.toString() + window.location.hash;
        history.replaceState(null, '', newUrl);
    };

    const params = new URLSearchParams(window.location.search);
    const requested = params.get('task');
    const initial = Array.from(select?.options || []).some(option => option.value === requested)
        ? requested : (select?.options[0]?.value ?? null);
    if (initial && select) {
        select.value = initial;
        showTask(initial);
    }

    select?.addEventListener('change', (e) => showTask(e.target.value));

    // Highlight on initial load
    window.highlightUserRow?.();
    const active = document.querySelector('.leaderboard-task:not(.hidden)');
    if (active) {
        setupChartToggle(active);
        renderRuntimeChart(active);
    }
});

window.addEventListener('resize', () => {
    renderRuntimeChart(document.querySelector('.leaderboard-task:not(.hidden)'));
});
