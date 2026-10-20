(() => {
    const form = document.getElementById('recover-secrets-form');
    if (!form) return;

    const actionsBySecret = {
        'deploy-key': ['get_public_key'],
        'webhook-secret': ['rotate_webhook_secret'],
        both: ['get_public_key', 'rotate_webhook_secret']
    };

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!form.reportValidity() || !form.dataset.recipient) return;

        const fields = new FormData(form);
        const actions = actionsBySecret[fields.get('secret')];
        if (!actions) return;

        const body = JSON.stringify({
            assignment_name: fields.get('assignment_name'),
            actions
        }, null, 2);
        const composeUrl = new URL('https://mail.google.com/mail/');
        composeUrl.search = new URLSearchParams({
            view: 'cm',
            fs: '1',
            to: form.dataset.recipient,
            su: 'Recover secret',
            body
        }).toString();
        window.open(composeUrl.toString(), '_blank', 'noopener,noreferrer');
    });
})();
