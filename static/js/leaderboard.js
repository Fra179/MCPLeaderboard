const MIN_HISTOGRAM_BINS = 200;
const MIN_RANGE_STEP_MS = 15;

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

// Highlight user row if GitHub username is saved
const highlightUserRow = () => {
    const savedUsername = localStorage.getItem('github-username');
    const scrollBtn = document.getElementById('scroll-to-user-btn');

    if (!savedUsername) {
        if (scrollBtn) scrollBtn.classList.add('hidden');
        return;
    }

    const normalizeName = (value) =>
        value.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9]/g, '');

    // Show the scroll button since username is set
    if (scrollBtn) scrollBtn.classList.remove('hidden');

    const normalizedTarget = normalizeName(savedUsername);
    const rows = document.querySelectorAll('.leaderboard-task:not(.hidden) table tbody tr');
    rows.forEach(row => {
        const studentCell = row.querySelector('td:nth-child(3)');
        const cellValue = studentCell?.textContent ? normalizeName(studentCell.textContent) : '';
        if (cellValue && cellValue === normalizedTarget) {
            row.classList.add('bg-yellow-100');
        } else {
            row.classList.remove('bg-yellow-100');
        }
    });
};

window.highlightUserRow = highlightUserRow;

window.scrollToUserRow = () => {
    const savedUsername = localStorage.getItem('github-username');
    if (!savedUsername) return;

    const normalizeName = (value) =>
        value.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedTarget = normalizeName(savedUsername);

    const rows = document.querySelectorAll('.leaderboard-task:not(.hidden) table tbody tr');
    for (let row of rows) {
        const studentCell = row.querySelector('td:nth-child(3)');
        const cellValue = studentCell?.textContent ? normalizeName(studentCell.textContent) : '';
        if (cellValue && cellValue === normalizedTarget) {
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

    ctx.clearRect(0, 0, width, height);

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
    const barWidth = (chartWidth - barGap * (bins - 1)) / bins;

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

// Task dropdown handling
document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('task-select');
    const containers = document.querySelectorAll('.leaderboard-task');

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
    const initial = params.get('task') || (select?.options[0]?.value ?? null);
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
