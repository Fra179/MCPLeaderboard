const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildPositionHistory, fetchPositionHistory } = require('../static/js/leaderboard-history');

const event = (event_id, submission_id, execution_time, status = 'graded') => ({
    event_id, submission_id, execution_time, status,
    assignment_name: 'example', task: 'cpu', timestamp: '2026-11-06T12:00:00Z',
});
const competitors = [
    { id: 'a', name: 'Alice', graded: true, penalty: 5 },
    { id: 'b', name: 'Bob', graded: true, penalty: 0 },
];

test('replays results in publication order, including errors, recovery and other competitors', () => {
    const events = [event(1, 'a', 10), event(2, 'b', 12), event(3, 'outsider', 1),
        event(4, 'b', null, 'error'), event(5, 'a', null, 'timeout'), event(6, 'a', 0)];
    const lines = buildPositionHistory(events, competitors);
    assert.deepEqual(lines[0].points.map(point => point.rank), [1, 2, 3, 2, 2, 2]);
    assert.deepEqual(lines[1].points.map(point => point.rank), [2, 1, 2, 3, 3, 3]);
    assert.equal(lines[0].points[5].eventId, 6);
});

test('plots the entire field, using descending scores and stable ties', () => {
    const rows = Array.from({ length: 12 }, (_, index) => ({ id: String(index), graded: true }));
    const events = rows.map((row, index) => event(index + 1, row.id, index));
    const lines = buildPositionHistory(events, rows, true);
    assert.equal(lines.length, 12);
    assert.equal(lines[0].points.at(-1).rank, 12);
    assert.deepEqual(buildPositionHistory([event(1, 'b', 15), event(2, 'a', 10)], competitors)
        .map(line => line.points.at(-1).rank), [1, 2]);
});

test('uses current performance for missing history across the whole field, adding penalties once', () => {
    const rows = [
        { id: 'a', name: 'Alice', graded: true, currentRuntime: 10, penalty: 5 },
        { id: 'b', name: 'Bob', graded: true, currentRuntime: 20, penalty: 0 },
        { id: 'c', name: 'Charlie', graded: true, currentRuntime: 30, penalty: 0 },
        { id: 'd', name: 'Pending', graded: false, currentRuntime: 0 },
    ];
    const lines = buildPositionHistory([
        event(1, 'c', 1), event(2, 'a', 25), event(3, 'a', null, 'error'), event(4, 'a', 0),
    ], rows);
    assert.deepEqual(lines[0].points.map(point => point.rank), [2, 3, 3, 2]);
    assert.deepEqual(lines[0].points.map(point => point.estimated), [true, false, false, false]);
    assert.deepEqual(lines[1].points.map(point => point.rank), [3, 2, 2, 3]);
    assert.ok(lines[1].points.every(point => point.estimated));
    assert.equal(lines.length, 4);
});

test('includes historical competitors who are no longer currently graded', () => {
    const lines = buildPositionHistory([event(1, 'former', 1), event(2, 'a', 10),
        event(3, 'former', null, 'error')], competitors);
    const former = lines.find(line => line.id === 'former');
    assert.ok(former);
    assert.deepEqual(former.points.map(point => point.rank), [1, 1, 3]);
});

test('follows assignment-scoped pagination until next_after is null', async () => {
    const requests = [];
    const pages = [{ events: [event(1, 'a', 4)], next_after: 1 },
        { events: [event(3, 'b', 5)], next_after: null }];
    const events = await fetchPositionHistory('https://example.test/', 'example', async (url, options) => {
        requests.push(url);
        assert.equal(options.cache, 'no-store');
        return { ok: true, json: async () => pages.shift() };
    });
    assert.deepEqual(events.map(row => row.event_id), [1, 3]);
    assert.deepEqual(requests.map(url => url.searchParams.get('after')), ['0', '1']);
    assert.ok(requests.every(url => url.searchParams.get('assignment_name') === 'example'));
});

test('handles empty history and rejects failed requests or invalid cursors', async () => {
    assert.deepEqual(await fetchPositionHistory('https://example.test', 'example', async () => ({
        ok: true, json: async () => ({ events: [], next_after: null }),
    })), []);
    await assert.rejects(fetchPositionHistory('https://example.test', 'example', async () => ({ ok: false, status: 503 })), /503/);
    await assert.rejects(fetchPositionHistory('https://example.test', 'example', async () => ({
        ok: true, json: async () => ({ events: [event(1, 'a', 4)], next_after: 2 }),
    })), /cursor/);
});


test('keeps a complete field from the start through failures and recovery', () => {
    const rows = [
        { id: 'a', name: 'Alice', graded: true, currentRuntime: 10 },
        { id: 'b', name: 'Bob', graded: false, status: 'error' },
        { id: 'c', name: 'Charlie', graded: true, currentRuntime: 20 },
    ];
    const events = [event(1, 'a', 10), event(2, 'c', null, 'error'),
        event(3, 'c', null, 'timeout'), event(4, 'b', 5), event(5, 'c', 2)];
    for (const descending of [false, true]) {
        const lines = buildPositionHistory(events, rows, descending);
        events.forEach((_, i) => assert.deepEqual(
            lines.map(line => line.points[i].rank).sort((a, b) => a - b), [1, 2, 3]));
    }
    const lines = buildPositionHistory(events, rows);
    assert.deepEqual(lines[1].points.map(point => point.rank), [3, 2, 2, 1, 2]);
    assert.deepEqual(lines[2].points.map(point => point.rank), [2, 3, 3, 3, 1]);
    assert.deepEqual(lines[2].points.map(point => point.status), ['graded', 'error', 'timeout', 'timeout', 'graded']);
});
