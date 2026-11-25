const encodeCSVCell = (value) => {
    let cell = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    // Spreadsheet apps can interpret untrusted text as a formula even inside quotes.
    if (typeof value === 'string' && /^(?:\s*[=+\-@\uFF1D\uFF0B\uFF0D\uFF20]|[\t\r\n])/.test(cell)) {
        cell = "'" + cell;
    }
    return /[",\r\n]/.test(cell) ? '"' + cell.replace(/"/g, '""') + '"' : cell;
};

const downloadTaskCSV = (container, assignment, entries) => {
    const { task } = container.dataset;
    const rows = Array.from(container.querySelectorAll('tbody tr'), (row, index) => {
        const entry = entries[row.dataset.entryIndex];
        return {
            id: entry.id ?? entry.submission_id,
            name: entry.name,
            task,
            commit_hash: typeof entry.commit_hash === 'string' ? entry.commit_hash : entry.commit_hash?.[task],
            status: entry.status?.[task],
            // error: entry.error?.[task],
            // stdout: entry.stdout?.[task],
            runtimes: entry.runtimes?.[task],
            avg_runtime: entry.avg_runtime?.[task],
            data: entry.data?.[task],
            reduction: entry.reduction?.[task],
            stdout_truncated: entry.stdout_truncated?.[task],
            stdout_original_bytes: entry.stdout_original_bytes?.[task],
            is_grading: entry.is_grading?.[task],
            grading_started_at: entry.grading_started_at?.[task],
            grading_commit_hash: entry.grading_commit_hash?.[task],
            rank: index + 1,
            penalty_amount: row.dataset.penaltyAmount === undefined ? null : Number(row.dataset.penaltyAmount),
            score: row.dataset.status === 'graded' ? Number(row.dataset.score ?? row.dataset.baseScore) : null,
        };
    });
    if (!rows.length) return;

    const records = [Object.keys(rows[0]), ...rows.map(Object.values)];
    const csv = records.map(record => record.map(encodeCSVCell).join(',')).join('\r\n') + '\r\n';
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = (assignment + '-' + task).replace(/[^a-zA-Z0-9._-]/g, '_') + '-leaderboard.csv';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const setupLeaderboardCSV = (standings, select, entries) => {
    const button = standings?.querySelector('#download-leaderboard-csv');
    if (!button || !select || !entries?.length) return;

    const selectedTask = () => document.getElementById('leaderboard-' + select.value);
    const updateButton = () => { button.disabled = !selectedTask(); };
    updateButton();
    select.addEventListener('change', updateButton);
    button.addEventListener('click', () => {
        const active = selectedTask();
        if (active) downloadTaskCSV(active, standings.dataset.assignment, entries);
    });
};
