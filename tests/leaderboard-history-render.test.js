const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const { buildPositionHistory, positionHistoryWindow } = require('../static/js/leaderboard-history');

// Minimal DOM surface used by the real SVG renderer; no browser dependencies.
class Element {
    constructor(tag) {
        this.tag = tag;
        this.children = [];
        this.attributes = {};
        this.style = { setProperty() {} };
    }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    addEventListener() {}
}

const render = (ranks, competitors = [{ id: 'a', name: 'Alice', graded: true }], options = {}, timestamps = []) => {
    const graph = new Element('div');
    const legend = new Element('div');
    const window = {};
    const document = {
        createElementNS: (_, tag) => new Element(tag),
        createElement: tag => new Element(tag),
    };
    vm.runInNewContext(readFileSync(require.resolve('../static/js/leaderboard-history'), 'utf8'), { window, document });
    const events = ranks.map((rank, index) => ({
        event_id: index + 1, submission_id: 'a', assignment_name: 'example', task: 'cpu',
        status: rank === null ? 'error' : 'graded', execution_time: rank,
        timestamp: timestamps[index] || `2026-11-06T12:00:0${index}Z`,
    }));
    const series = buildPositionHistory(events, competitors);
    window.drawPositionHistory({ querySelector: selector => selector === '.history-graph' ? graph : legend }, series, events, options);
    const svg = graph.children[0];
    return { svg, legend, group: svg.children.find(child => child.tag === 'g') };
};

test('keeps the original sparse markers and compact chart', () => {
    const { svg, group } = render([1, 1, 1]);
    assert.equal(svg.attributes.viewBox, '0 0 1000 480');
    const dots = group.children.filter(child => child.tag === 'circle');
    assert.equal(dots.length, 2);
    assert.match(dots[0].children[0].textContent, /Event 1\b/);
    assert.match(dots[1].children[0].textContent, /Event 3\b/);
});

test('renders a continuous line through errors and recovery', () => {
    const { group } = render([1, 1, 1, null, 1, 1, 1]);
    const path = group.children.find(child => child.tag === 'path').attributes.d;
    assert.equal((path.match(/M/g) || []).length, 1);
    assert.ok(path.includes('L'));
    assert.doesNotMatch(path, /[HV]/);
    const titles = group.children.filter(child => child.tag === 'circle').map(dot => dot.children[0].textContent);
    assert.ok(titles.some(title => title.includes('error: no score; placed after scored results')));
});

test('spaces results by elapsed time rather than event index', () => {
    const { group } = render([1, null, 1], undefined, {}, [
        '2026-11-06T00:00:00Z', '2026-11-06T01:00:00Z', '2026-11-07T00:00:00Z',
    ]);
    const dots = group.children.filter(child => child.tag === 'circle');
    assert.equal(Number(dots[0].attributes.cx), 48);
    assert.equal(Number(dots[1].attributes.cx), 48 + 930 / 24);
    assert.equal(Number(dots[2].attributes.cx), 978);
});

test('carries the last position into quiet windows without inventing result markers', () => {
    const start = Date.parse('2026-11-07T00:00:00Z');
    const end = start + 86400000;
    const { group } = render([1, null, 1], undefined, { start, end });
    assert.equal(group.children.filter(child => child.tag === 'circle').length, 0);
    assert.match(group.children.find(child => child.tag === 'path').attributes.d, /^M48,.*L978,/);
});

test('window boundaries keep the prior rank and exclude future results', () => {
    const points = [
        { timestamp: '2026-11-06T00:00:00Z', rank: 3 },
        { timestamp: '2026-11-07T12:00:00Z', rank: 1 },
        { timestamp: '2026-11-09T00:00:00Z', rank: 2 },
    ];
    const start = Date.parse('2026-11-07T00:00:00Z');
    const end = start + 86400000;
    const visible = positionHistoryWindow(points, start, end);
    assert.deepEqual(visible.map(point => point.rank), [3, 1, 1]);
    assert.deepEqual(visible.map(point => point.time), [start, start + 43200000, end]);
    assert.equal(points.length, 3);
});

test('keeps hidden competitors hidden when the time range changes', () => {
    const { group, legend } = render([1, 1], undefined, { hiddenIds: new Set(['a']) });
    assert.equal(group.style.display, 'none');
    assert.equal(legend.children[0].attributes['aria-pressed'], 'false');
});
