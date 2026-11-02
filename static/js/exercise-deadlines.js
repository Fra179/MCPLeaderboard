(() => {
    const dateFormatter = new Intl.DateTimeFormat(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
    document.querySelectorAll('[data-local-deadline]').forEach(element => {
        const deadline = new Date(element.dateTime);
        if (!Number.isNaN(deadline.getTime())) {
            element.textContent = dateFormatter.format(deadline);
        }
    });

    const deadlines = document.querySelectorAll('[data-exercise-deadline]');
    if (!deadlines.length) return;

    const update = () => {
        const now = Date.now();
        deadlines.forEach(element => {
            const remaining = Date.parse(element.dataset.exerciseDeadline) - now;
            if (!Number.isFinite(remaining)) return;
            if (remaining <= 0) {
                element.textContent = 'Deadline passed';
                element.dataset.state = 'expired';
                return;
            }

            const minutes = Math.ceil(remaining / 60000);
            const days = Math.floor(minutes / 1440);
            const hours = Math.floor(minutes / 60) % 24;
            element.textContent = `${days ? `${days}d ` : ''}${hours}h ${minutes % 60}m left`;
            element.dataset.state = remaining <= 86400000 ? 'soon' : 'open';
        });
    };

    update();
    window.setInterval(update, 1000);
    document.addEventListener('visibilitychange', update);
})();
