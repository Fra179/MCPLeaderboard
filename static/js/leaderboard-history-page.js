document.addEventListener('DOMContentLoaded', () => {
    const page = document.getElementById('history-page');
    const assignmentSelect = document.getElementById('history-assignment');
    const taskSelect = document.getElementById('history-task');
    const status = page.querySelector('.history-status');
    const retry = document.getElementById('history-retry');
    const back = document.getElementById('history-back');
    const controls = document.getElementById('history-series-controls');
    const rangeSelect = document.getElementById('history-range');
    const earlier = document.getElementById('history-earlier');
    const later = document.getElementById('history-later');
    const latest = document.getElementById('history-latest');
    const hiddenIds = new Set();
    let windowEnd = null;
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('assignment');
    if ([...assignmentSelect.options].some(option => option.value === requested)) assignmentSelect.value = requested;
    let entries = [], events = [], penalties = [], penaltyWarning = '', requestVersion = 0;

    const fetchJSON = async path => {
        const url = new URL(`${page.dataset.apiUrl.replace(/\/+$/, '')}${path}`);
        url.searchParams.set('assignment_name', assignmentSelect.value);
        const response = await fetch(url, { credentials: 'omit', cache: 'no-store' });
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        return response.json();
    };

    const updateLinks = () => {
        const url = new URL(window.location.href);
        url.searchParams.set('assignment', assignmentSelect.value);
        if (taskSelect.value) url.searchParams.set('task', taskSelect.value);
        else url.searchParams.delete('task');
        history.replaceState(null, '', url);
        const option = assignmentSelect.selectedOptions[0];
        if (option) {
            const standings = new URL(option.dataset.url, window.location.origin);
            if (taskSelect.value) standings.searchParams.set('task', taskSelect.value);
            standings.hash = 'leaderboard';
            back.href = standings;
        }
    };

    const clearGraph = () => {
        page.querySelector('.history-graph').replaceChildren();
        page.querySelector('.history-legend').replaceChildren();
        controls.hidden = true;
        earlier.disabled = later.disabled = latest.disabled = true;
    };

    const render = () => {
        clearGraph();
        updateLinks();
        const task = taskSelect.value;
        const taskEvents = events.filter(event => event.task === task);
        if (!taskEvents.length) {
            status.textContent = `No position history recorded for this task yet. New completed evaluations will appear here.${penaltyWarning}`;
            return;
        }
        const taskPenalties = new Map(penalties.filter(penalty => penalty.task === task)
            .map(penalty => [penalty.id.toLowerCase(), penalty.amount]));
        const competitors = entries.filter(entry => entry.tasks?.includes(task)).map(entry => {
            const id = (entry.submission_id || entry.id || '').toLowerCase();
            return {
                id, name: entry.name, graded: entry.status?.[task] === 'graded',
                status: entry.status?.[task],
                currentRuntime: entry.avg_runtime?.[task], penalty: taskPenalties.get(id) || 0,
            };
        });
        const missingIds = competitors.some(row => !row.id);
        const descending = assignmentSelect.selectedOptions[0].dataset.order === 'desc';
        competitors.sort((a, b) => {
            if (a.graded !== b.graded) return a.graded ? -1 : 1;
            return a.graded ? ((a.currentRuntime + a.penalty) - (b.currentRuntime + b.penalty)) * (descending ? -1 : 1)
                : String(a.name).localeCompare(String(b.name));
        });
        competitors.forEach((row, index) => { if (row.graded) row.currentRank = index + 1; });
        const series = buildPositionHistory(taskEvents, competitors.filter(row => row.id), descending)
            .filter(line => line.points.some(point => point.rank !== null));
        if (!series.length) {
            status.textContent = `No successful results recorded for this task yet.${penaltyWarning}`;
            return;
        }
        const firstTime = taskEvents.reduce((min, event) => Math.min(min, Date.parse(event.timestamp)), Infinity);
        const lastTime = taskEvents.reduce((max, event) => Math.max(max, Date.parse(event.timestamp)), -Infinity);
        const duration = rangeSelect.value === 'all' ? null : Number(rangeSelect.value);
        const end = windowEnd === null ? lastTime : Math.min(lastTime, Math.max(firstTime, windowEnd));
        const start = duration === null ? firstTime : end - duration;
        windowEnd = end;
        earlier.disabled = duration === null || start <= firstTime;
        later.disabled = latest.disabled = duration === null || end >= lastTime;
        window.drawPositionHistory(page, series, taskEvents, { start, end, hiddenIds });
        controls.hidden = false;
        const visibleCount = taskEvents.filter(event => Date.parse(event.timestamp) >= start && Date.parse(event.timestamp) <= end).length;
        status.textContent = 'Task history';
    };

    const load = async () => {
        const version = ++requestVersion;
        windowEnd = null;
        hiddenIds.clear();
        const requestedTask = new URLSearchParams(window.location.search).get('task');
        clearGraph();
        retry.hidden = true;
        taskSelect.disabled = true;
        taskSelect.replaceChildren();
        status.textContent = 'Loading full position history…';
        updateLinks();
        if (!assignmentSelect.value) {
            status.textContent = 'No exercises available.';
            return;
        }
        try {
            const assignment = assignmentSelect.value;
            const results = await Promise.allSettled([
                fetchPositionHistory(page.dataset.apiUrl, assignment),
                page.dataset.source === 'api' ? fetchJSON('/leaderboard')
                    : Promise.resolve(JSON.parse(document.getElementById('history-file-data').textContent)),
                fetchJSON('/penalties'),
            ]);
            if (version !== requestVersion) return;
            if (results[0].status === 'rejected') throw results[0].reason;
            if (results[1].status === 'rejected') throw results[1].reason;
            events = results[0].value;
            entries = results[1].value[assignment] || [];
            if (!Array.isArray(entries)) throw new Error('Invalid leaderboard response');
            const penaltyPayload = results[2].status === 'fulfilled' ? results[2].value.penalties : null;
            const validPenalties = Array.isArray(penaltyPayload) && penaltyPayload.every(penalty =>
                typeof penalty.id === 'string' && typeof penalty.task === 'string' && Number.isFinite(penalty.amount) && penalty.amount >= 0);
            penalties = validPenalties ? penaltyPayload : [];
            penaltyWarning = validPenalties ? '' : ' Penalties are unavailable; ranks exclude penalties.';
            const tasks = [...new Set([...entries.flatMap(entry => entry.tasks || []), ...events.map(event => event.task)])].sort();
            tasks.forEach(task => {
                const option = document.createElement('option');
                option.value = task;
                option.textContent = task;
                taskSelect.append(option);
            });
            if (tasks.includes(requestedTask)) taskSelect.value = requestedTask;
            taskSelect.disabled = !tasks.length;
            render();
        } catch (error) {
            if (version !== requestVersion) return;
            console.error('Could not load history:', error);
            status.textContent = 'Unable to load leaderboard history. Please try again.';
            retry.hidden = false;
        }
    };

    assignmentSelect.addEventListener('change', load);
    taskSelect.addEventListener('change', () => { windowEnd = null; hiddenIds.clear(); render(); });
    rangeSelect.addEventListener('change', render);
    earlier.addEventListener('click', () => { windowEnd -= Number(rangeSelect.value); render(); });
    later.addEventListener('click', () => { windowEnd += Number(rangeSelect.value); render(); });
    latest.addEventListener('click', () => { windowEnd = null; render(); });
    retry.addEventListener('click', load);
    const setAllVisible = visible => page.querySelectorAll('.history-legend-item').forEach(button => {
        if ((button.getAttribute('aria-pressed') === 'true') !== visible) button.click();
    });
    document.getElementById('history-show-all').addEventListener('click', () => setAllVisible(true));
    document.getElementById('history-hide-all').addEventListener('click', () => setAllVisible(false));
    load();
});
