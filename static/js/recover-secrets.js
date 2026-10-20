(() => {
    const form = document.getElementById('recover-secrets-form');
    if (!form) return;

    const actionsBySecret = {
        'deploy-key': ['get_public_key'],
        'webhook-secret': ['rotate_webhook_secret'],
        both: ['get_public_key', 'rotate_webhook_secret']
    };

    const details = document.getElementById('recovery-email-details');
    const copyStatus = document.getElementById('recovery-copy-status');
    const subject = 'Recover secret';

    const prepareEmail = () => {
        const fields = new FormData(form);
        const actions = actionsBySecret[fields.get('secret')];
        if (!actions || !fields.get('assignment_name')) return null;

        const body = JSON.stringify({
            assignment_name: fields.get('assignment_name'),
            actions
        }, null, 2);
        document.getElementById('recovery-email-recipient').value = form.dataset.recipient;
        document.getElementById('recovery-email-subject').value = subject;
        document.getElementById('recovery-email-body').value = body;
        copyStatus.textContent = '';
        details.hidden = false;
        return body;
    };

    form.addEventListener('change', () => {
        if (!details.hidden) prepareEmail();
    });

    document.querySelectorAll('[data-recovery-copy]').forEach((button) => {
        button.addEventListener('click', async () => {
            const field = document.getElementById(button.dataset.recoveryCopy);
            try {
                await navigator.clipboard.writeText(field.value);
                copyStatus.textContent = 'Copied to clipboard.';
            } catch {
                field.focus();
                field.select();
                copyStatus.textContent = 'Use Ctrl+C (or Command+C on Mac) to copy the selected text.';
            }
        });
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!form.reportValidity() || !form.dataset.recipient) return;

        const body = prepareEmail();
        if (body === null) return;
        const composeUrl = new URL('https://mail.google.com/mail/');
        composeUrl.search = new URLSearchParams({
            view: 'cm',
            fs: '1',
            to: form.dataset.recipient,
            su: subject,
            body
        }).toString();
        const accountChooserUrl = new URL('https://accounts.google.com/AccountChooser');
        accountChooserUrl.search = new URLSearchParams({
            service: 'mail',
            continue: composeUrl.toString()
        }).toString();
        window.open(accountChooserUrl.toString(), '_blank', 'noopener,noreferrer');
    });
})();
