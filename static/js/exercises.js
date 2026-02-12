const switchTab = (tabName) => {
    const contents = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.tab-btn');
    const activeContent = document.getElementById('content-' + tabName);
    const activeBtn = document.getElementById('btn-' + tabName);

    if (!activeContent || !activeBtn) return;

    contents.forEach(el => el.classList.add('hidden'));
    buttons.forEach(btn => {
        btn.classList.remove('bg-white', 'text-blue-600', 'shadow-sm');
        btn.classList.add('text-gray-500', 'hover:text-gray-900');
    });

    activeContent.classList.remove('hidden');
    activeBtn.classList.remove('text-gray-500', 'hover:text-gray-900');
    activeBtn.classList.add('bg-white', 'text-blue-600', 'shadow-sm');

    if (tabName === 'leaderboard') {
        window.highlightUserRow?.();
    }

    if (history.pushState) {
        history.pushState(null, null, '#' + tabName);
    } else {
        location.hash = '#' + tabName;
    }
};

window.switchTab = switchTab;

const setupTabSwitching = () => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'leaderboard') {
        switchTab('leaderboard');
    } else if (document.getElementById('content-description')) {
        switchTab('description');
    }
};

const setupGithubModal = () => {
    const githubModal = document.getElementById('github-modal');
    const githubBtn = document.getElementById('github-btn');
    const githubUsernameInput = document.getElementById('github-username');

    if (!githubModal || !githubBtn || !githubUsernameInput) return;

    const openGithubModal = () => {
        const saved = localStorage.getItem('github-username');
        githubUsernameInput.value = saved || '';
        githubModal.classList.remove('hidden');
        githubModal.classList.add('flex');
        githubUsernameInput.focus();
    };

    const closeGithubModal = () => {
        githubModal.classList.add('hidden');
        githubModal.classList.remove('flex');
    };

    const saveGithubUsername = () => {
        const username = githubUsernameInput.value.trim();
        if (username) {
            localStorage.setItem('github-username', username);
            closeGithubModal();
            window.highlightUserRow?.();
        } else {
            alert('Please enter a GitHub username');
        }
    };

    githubBtn.addEventListener('click', openGithubModal);
    githubModal.addEventListener('click', closeGithubModal);
    githubUsernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveGithubUsername();
        }
    });

    window.openGithubModal = openGithubModal;
    window.closeGithubModal = closeGithubModal;
    window.saveGithubUsername = saveGithubUsername;
};

document.addEventListener('DOMContentLoaded', () => {
    setupTabSwitching();
    setupGithubModal();
});

window.addEventListener('popstate', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'leaderboard') {
        switchTab('leaderboard');
    } else {
        switchTab('description');
    }
});
