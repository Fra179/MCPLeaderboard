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

const setupStudentIdModal = () => {
    const studentIdModal = document.getElementById('student-id-modal');
    const studentIdBtn = document.getElementById('student-id-btn');
    const studentIdInput = document.getElementById('student-id');

    if (!studentIdModal || !studentIdBtn || !studentIdInput) return;

    const openStudentIdModal = () => {
        const saved = localStorage.getItem('student-id');
        studentIdInput.value = saved || '';
        studentIdModal.classList.remove('hidden');
        studentIdModal.classList.add('flex');
        studentIdInput.focus();
    };

    const closeStudentIdModal = () => {
        studentIdModal.classList.add('hidden');
        studentIdModal.classList.remove('flex');
    };

    const saveStudentId = () => {
        const studentId = studentIdInput.value.trim();
        if (studentId) {
            localStorage.setItem('student-id', studentId);
            closeStudentIdModal();
            window.highlightUserRow?.();
        } else {
            alert('Please enter your GitHub username');
        }
    };

    studentIdBtn.addEventListener('click', openStudentIdModal);
    studentIdModal.addEventListener('click', closeStudentIdModal);
    studentIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveStudentId();
        }
    });

    window.openStudentIdModal = openStudentIdModal;
    window.closeStudentIdModal = closeStudentIdModal;
    window.saveStudentId = saveStudentId;
};

document.addEventListener('DOMContentLoaded', () => {
    setupTabSwitching();
    setupStudentIdModal();
});

window.addEventListener('popstate', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'leaderboard') {
        switchTab('leaderboard');
    } else {
        switchTab('description');
    }
});
