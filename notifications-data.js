function getNotifications() {
    return JSON.parse(localStorage.getItem('notifications')) || [];
}

function saveNotifications(list) {
    localStorage.setItem('notifications', JSON.stringify(list));
}

function addNotification(email, project, message, type) {
    const list = getNotifications();

    list.push({
        id: Date.now() + Math.random(),
        email: email.toLowerCase(),
        message: message || ('You were added to project "' + project.name + '"'),
        type: type || 'added',
        projectId: project.id,
        createdAt: new Date().toISOString(),
        read: false
    });

    saveNotifications(list);
}

function getMyNotifications() {
    const me = (localStorage.getItem('currentUser') || '').toLowerCase();
    return getNotifications().filter(function (n) {
        return n.email === me;
    });
}

function getUnreadCount() {
    return getMyNotifications().filter(function (n) {
        return !n.read;
    }).length;
}

function markAllAsRead() {
    const me = (localStorage.getItem('currentUser') || '').toLowerCase();
    const list = getNotifications();

    list.forEach(function (n) {
        if (n.email === me) {
            n.read = true;
        }
    });

    saveNotifications(list);
}

function updateNotifBadge() {
    const badge = document.querySelector('#notif-count');
    if (!badge) return;

    const count = getUnreadCount();

    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-flex';
    } else {
        badge.style.display = 'none';
    }
}

const STALE_DAYS = 3;   // غيّرها كما تبي

function checkStaleBugs() {
    const me = (localStorage.getItem('currentUser') || '').toLowerCase();
    if (!me) return;

    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const now = Date.now();
    let changed = false;

    projects.forEach(function (p) {
        p.bugs.forEach(function (bug) {
            if (bug.status === 'Closed') return;
            if ((bug.assignedTo || '').toLowerCase() !== me) return;
            if (!bug.history || bug.history.length === 0) return;

            const last = bug.history[bug.history.length - 1];
            const days = (now - new Date(last.date)) / (1000 * 60 * 60 * 24);

            if (days < STALE_DAYS) return;

            // لا تكرر التنبيه لنفس آخر نشاط
            if (bug.staleNotifiedFor === last.date) return;

            addNotification(
                bug.assignedTo,
                p,
                bug.id + ' in "' + p.name + '" has had no status change for ' + Math.floor(days) + ' days',
                'stale'
            );

            bug.staleNotifiedFor = last.date;
            changed = true;
        });
    });

    if (changed) {
        localStorage.setItem('projects', JSON.stringify(projects));
    }
}

checkStaleBugs();
updateNotifBadge();