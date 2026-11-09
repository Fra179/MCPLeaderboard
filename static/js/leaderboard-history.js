// Replay the whole field, using current performance until the first recorded result.
const buildPositionHistory = (events, competitors, descending = false) => {
    const participants = new Map(competitors.map(row => [row.id, row]));
    events.forEach(event => {
        const id = event.submission_id.toLowerCase();
        if (!participants.has(id)) participants.set(id, { id, name: event.github_username || id, graded: false });
    });
    const series = [...participants.values()].map(row => ({ ...row, points: [] }));
    const identities = new Map(competitors.map((row, index) => [row.id, { ...row, index }]));
    const latest = new Map(competitors
        .filter(row => row.graded && Number.isFinite(row.currentRuntime))
        .map(row => [row.id, row.currentRuntime + (row.penalty || 0)]));
    const recorded = new Set();
    const statuses = new Map(series.map(row => [row.id, row.graded ? 'graded' : (row.status || 'unrecorded')]));
    events.forEach((event, index) => {
        const id = event.submission_id.toLowerCase();
        recorded.add(id);
        statuses.set(id, event.status);
        if (event.status === 'graded' && Number.isFinite(event.execution_time)) {
            latest.set(id, event.execution_time + (identities.get(id)?.penalty || 0));
        } else {
            latest.delete(id);
        }
        // Failed/unscored entries remain in the table, below scored entries.
        // Rank the same full field at every event so failures never erase a line.
        const ranked = [...participants.values()].sort((a, b) => {
            const aScored = latest.has(a.id), bScored = latest.has(b.id);
            if (aScored !== bScored) return aScored ? -1 : 1;
            return aScored
                ? (latest.get(a.id) - latest.get(b.id)) * (descending ? -1 : 1) ||
                    (identities.get(a.id)?.index ?? Infinity) - (identities.get(b.id)?.index ?? Infinity)
                : String(a.name).localeCompare(String(b.name)) || a.id.localeCompare(b.id);
        });
        const positions = new Map(ranked.map((row, rank) => [row.id, rank + 1]));
        series.forEach(line => line.points.push({
            x: index, rank: positions.get(line.id) ?? null,
            timestamp: event.timestamp, eventId: event.event_id,
            estimated: !recorded.has(line.id),
            status: statuses.get(line.id),
        }));
    });
    return series;
};

const fetchPositionHistory = async (baseURL, assignment, fetcher = fetch) => {
    const events = [];
    let after = 0;
    do {
        const url = new URL(`${baseURL.replace(/\/+$/, '')}/leaderboard/history`);
        url.searchParams.set('assignment_name', assignment);
        url.searchParams.set('limit', '1000');
        url.searchParams.set('after', String(after));
        const response = await fetcher(url, { credentials: 'omit', cache: 'no-store' });
        if (!response.ok) throw new Error(`History request failed (${response.status})`);
        const payload = await response.json();
        if (!Array.isArray(payload?.events) ||
            (payload.next_after !== null && (!Number.isSafeInteger(payload.next_after) || payload.next_after <= after))) {
            throw new Error('Invalid history response');
        }
        for (const event of payload.events) {
            if (!Number.isSafeInteger(event.event_id) || event.event_id <= (events.at(-1)?.event_id ?? after) ||
                event.assignment_name !== assignment || typeof event.submission_id !== 'string' ||
                typeof event.task !== 'string' || !Number.isFinite(Date.parse(event.timestamp)) ||
                !['graded', 'error', 'timeout'].includes(event.status) ||
                (event.status === 'graded' && (!Number.isFinite(event.execution_time) || event.execution_time < 0))) {
                throw new Error('Invalid history event');
            }
            events.push(event);
        }
        if (payload.next_after !== null && payload.next_after !== payload.events.at(-1)?.event_id) {
            throw new Error('Invalid history cursor');
        }
        after = payload.next_after;
    } while (after !== null);
    return events;
};

// Keep the last known position at the left boundary, even in quiet windows.
const positionHistoryWindow = (points, start, end) => {
    const ordered = points.map(point => ({ ...point, time: Date.parse(point.timestamp) }))
        .sort((a, b) => a.time - b.time);
    const before = ordered.filter(point => point.time < start).at(-1);
    const visible = ordered.filter(point => point.time >= start && point.time <= end);
    if (before) visible.unshift({ ...before, time: start, boundary: true });
    const last = visible.at(-1);
    if (last && last.time < end) visible.push({ ...last, time: end, boundary: true });
    return visible;
};

if (typeof module !== 'undefined') module.exports = { buildPositionHistory, fetchPositionHistory, positionHistoryWindow };

if (typeof window !== 'undefined') {
    const colors = ['#2563eb', '#dc2626', '#059669', '#9333ea', '#d97706', '#0891b2', '#db2777', '#4f46e5', '#4d7c0f', '#475569'];
    const svgElement = (tag, attributes = {}, text) => {
        const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
        if (text !== undefined) element.textContent = text;
        return element;
    };

    const drawHistory = (container, series, events, options = {}) => {
        const graph = container.querySelector('.history-graph');
        const legend = container.querySelector('.history-legend');
        graph.replaceChildren();
        legend.replaceChildren();
        const width = 1000, height = 480;
        const left = 48, right = 22, top = 28, bottom = 55;
        const maxRank = Math.max(2, ...series.map(line => line.points.reduce((max, point) => Math.max(max, point.rank || 0), 0)));
        const times = events.map(event => Date.parse(event.timestamp));
        const start = options.start ?? times.reduce((min, time) => Math.min(min, time), Infinity);
        const end = options.end ?? times.reduce((max, time) => Math.max(max, time), -Infinity);
        const x = time => left + (end === start ? 0.5 : (time - start) / (end - start)) * (width - left - right);
        const y = rank => top + (rank - 1) / (maxRank - 1) * (height - top - bottom);
        const svg = svgElement('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': 'Leaderboard position history for the selected time range. Rank one is at the top.' });
        svg.append(svgElement('title', {}, 'Leaderboard position history'));
        const ticks = new Set([1, maxRank]);
        const step = Math.max(1, Math.ceil((maxRank - 1) / 12));
        for (let rank = step; rank < maxRank; rank += step) ticks.add(rank);
        [...ticks].sort((a, b) => a - b).forEach(rank => {
            svg.append(svgElement('line', { x1: left, x2: width - right, y1: y(rank), y2: y(rank), stroke: '#e5e7eb' }));
            svg.append(svgElement('text', { x: left - 10, y: y(rank) + 4, 'text-anchor': 'end', fill: '#6b7280', 'font-size': 12 }, `#${rank}`));
        });
        const dateLabel = value => new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const timesToLabel = [...new Set([start, start + (end - start) / 2, end])];
        timesToLabel.forEach((time, tick) => svg.append(svgElement('text', {
            x: x(time), y: height - 30, fill: '#6b7280', 'font-size': 11,
            'text-anchor': tick === 0 ? 'start' : tick === timesToLabel.length - 1 ? 'end' : 'middle',
        }, dateLabel(time))));
        svg.append(svgElement('text', { x: width / 2, y: height - 7, 'text-anchor': 'middle', fill: '#9ca3af', 'font-size': 11 }, 'Completed results · elapsed time'));

        series.forEach((line, index) => {
            const color = colors[index] || `hsl(${(index * 137.508) % 360} 65% 42%)`;
            const group = svgElement('g');
            const points = positionHistoryWindow(line.points, start, end);
            let path = '', previous = null;
            points.forEach(point => {
                if (point.rank === null) { previous = null; return; }
                path += previous === null ? `M${x(point.time)},${y(point.rank)}` : `L${x(point.time)},${y(point.rank)}`;
                previous = point;
            });
            group.append(svgElement('path', { d: path, fill: 'none', stroke: color, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
            // Mark transitions and endpoints; native SVG titles provide exact values.
            points.forEach((point, i) => {
                if (point.rank === null || point.boundary) return;
                if (i > 0 && i < points.length - 1 &&
                    !points[i - 1].boundary && !points[i + 1].boundary &&
                    points[i - 1].rank === point.rank && points[i + 1].rank === point.rank &&
                    points[i - 1].status === point.status && points[i + 1].status === point.status) return;
                const dot = svgElement('circle', { cx: x(point.time), cy: y(point.rank), r: 3.5, fill: color, stroke: 'white', 'stroke-width': 1 });
                const unscored = point.status !== 'graded';
                dot.append(svgElement('title', {}, `${line.name}: #${point.rank}\n${new Date(point.timestamp).toLocaleString()}\nEvent ${point.eventId}${unscored ? `\n${point.status}: no score; placed after scored results` : ''}${point.estimated ? (unscored ? '\nEstimated starting position' : '\nEstimated using current performance') : ''}`));
                group.append(dot);
            });
            svg.append(group);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'history-legend-item';
            button.style.setProperty('--series-color', color);
            const visible = !options.hiddenIds?.has(line.id);
            button.setAttribute('aria-pressed', String(visible));
            group.style.display = visible ? '' : 'none';
            button.textContent = `${line.currentRank ? `#${line.currentRank} ` : ''}${line.name}${line.points.every(point => point.estimated) ? (line.graded ? ' (current performance)' : ' (unscored starting position)') : ''}`;
            button.addEventListener('click', () => {
                const visible = button.getAttribute('aria-pressed') !== 'true';
                button.setAttribute('aria-pressed', String(visible));
                group.style.display = visible ? '' : 'none';
                if (visible) options.hiddenIds?.delete(line.id);
                else options.hiddenIds?.add(line.id);
            });
            legend.append(button);
        });
        graph.append(svg);
    };

    // The history page owns loading; standings pages only link here.
    window.drawPositionHistory = drawHistory;
}
