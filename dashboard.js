const userBtn = document.querySelector('.user-btn');
const dropdown = document.querySelector('.dropdown');
// ========== القائمة المنسدلة ==========
userBtn.addEventListener('click', function (event) {
    event.stopPropagation(); // يمنع الضغطة من الوصول للـ document
    dropdown.classList.toggle('show');
});

// إغلاق القائمة لو ضغط المستخدم في أي مكان ثاني
document.addEventListener('click', function () {
    dropdown.classList.remove('show');
});
function getAllBugs() {
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    let all = [];
    projects.forEach(function (p) {
        all = all.concat(p.bugs);
    });
    return all;
}
function getStartDate(period) {
    const now = new Date();

    if (period === 'today') {
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    if (period === 'month') {
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    if (period === '6months') {
        return new Date(now.getFullYear(), now.getMonth() - 5, 1);
    }
    if (period === 'year') {
        return new Date(now.getFullYear(), 0, 1);
    }
}
function getFilteredBugs(period) {
    const start = getStartDate(period);

    return getAllBugs().filter(function (bug) {
        if (!bug.date) return false;
        return new Date(bug.date) >= start;
    });
}
function calculateStats(bugs) {
    const stats = {
        total: bugs.length,
        open: 0,
        critical: 0,
        resolved: 0,
        severity: { Blocker: 0, Critical: 0, Major: 0, Normal: 0, Minor: 0, Cosmetic: 0 }
    };

    bugs.forEach(function (bug) {
       if (bug.status === 'New' || bug.status === 'Open' || bug.status === 'In Progress') stats.open++;
       if (bug.status === 'Closed') stats.resolved++;
        if (bug.severity === 'Critical') stats.critical++;
        if (stats.severity[bug.severity] !== undefined) stats.severity[bug.severity]++;
    });

    return stats;
}
const periodFilter = document.querySelector('#period-filter');
function getResolutionDays(bug) {
    if (bug.status !== 'Closed' || !bug.history) return null;

    const start = bug.history.find(function (h) {
        return h.action === 'Created' || h.action === 'Imported';
    });

    // آخر مرة انقفل فيها
    let end = null;
    bug.history.forEach(function (h) {
        if (h.to === 'Closed' && h.action === 'Status changed') end = h;
    });

    if (!start || !end) return null;

    const ms = new Date(end.date) - new Date(start.date);
    return ms / (1000 * 60 * 60 * 24);
}

function calcAvgResolution(bugs) {
    const days = bugs.map(getResolutionDays).filter(function (d) {
        return d !== null;
    });

    if (days.length === 0) return '-';

    const sum = days.reduce(function (a, b) { return a + b; }, 0);
    return (sum / days.length).toFixed(1) + ' days';
}
function renderDashboard() {
    const stats = calculateStats(getFilteredBugs(periodFilter.value));

    document.querySelector('#total-bugs').textContent = stats.total;
    document.querySelector('#open-bugs').textContent = stats.open;
    document.querySelector('#critical-bugs').textContent = stats.critical;
    document.querySelector('#resolved-bugs').textContent = stats.resolved;
const filtered = getFilteredBugs(periodFilter.value);
document.querySelector('#avg-resolution').textContent = calcAvgResolution(filtered);
    renderSeverityChart(stats.severity, stats.total);
}
function renderSeverityChart(severity, total) {
    const chart = document.querySelector('#severity-chart');
    chart.innerHTML = '';

    Object.keys(severity).forEach(function (name) {
        const count = severity[name];
        const percent = total > 0 ? (count / total) * 100 : 0;

        const row = document.createElement('div');
        row.classList.add('bar-row');

        const label = document.createElement('span');
        label.classList.add('bar-label');
        label.textContent = name;

        const track = document.createElement('div');
        track.classList.add('bar-track');

        const fill = document.createElement('div');
        fill.classList.add('bar-fill');
        fill.style.width = percent + '%';

        const value = document.createElement('span');
        value.classList.add('bar-value');
        value.textContent = count;

        track.appendChild(fill);
        row.appendChild(label);
        row.appendChild(track);
        row.appendChild(value);
        chart.appendChild(row);
    });
}
periodFilter.addEventListener('change', renderDashboard);
renderDashboard();