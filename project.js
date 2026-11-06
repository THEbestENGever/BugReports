// ========== اختيار العناصر ==========
const projectTitle = document.querySelector('#project-title');
const projectEmployees = document.querySelector('#project-employees');
const bugsBody = document.querySelector('#bugs-body');
const addBugBtn = document.querySelector('#add-bug-btn');
const modal = document.querySelector('#outer-div');
const closeBtn = document.querySelector('.close-btn');
const bugForm = document.querySelector('#bug-form');
const settingsBtn = document.querySelector('#settings-btn');
const settingsMenu = document.querySelector('#settings-menu');
const membersList = document.querySelector('#members-list');
const newMemberEmail = document.querySelector('#new-member-email');
const addMemberBtn = document.querySelector('#add-member-btn');
const statusSelect = document.querySelector('#project-status-select');
const deleteProjectBtn = document.querySelector('#delete-project-btn');
const historyModal = document.querySelector('#history-modal');
const historyList = document.querySelector('#history-list');
const historyTitle = document.querySelector('#history-title');
const historyClose = document.querySelector('#history-close');
const importBtn = document.querySelector('#import-btn');
const importFile = document.querySelector('#import-file');
const commentsModal = document.querySelector('#comments-modal');
const commentsList = document.querySelector('#comments-list');
const commentsTitle = document.querySelector('#comments-title');
const commentsClose = document.querySelector('#comments-close');
const commentForm = document.querySelector('#comment-form');
const commentText = document.querySelector('#comment-text');
const filterStatus = document.querySelector('#filter-status');
const filterSeverity = document.querySelector('#filter-severity');
const filterAssignee = document.querySelector('#filter-assignee');
const filterReset = document.querySelector('#filter-reset');

let currentCommentBug = null;   // البق المفتوح تعليقاته حالياً

// ========== جلب المشروع من localStorage ==========
const params = new URLSearchParams(window.location.search);
const projectId = Number(params.get('id'));

const projects = JSON.parse(localStorage.getItem('projects')) || [];
const project = projects.find(function (p) {
    return p.id === projectId;
});

// لو المشروع غير موجود، ارجع للصفحة الرئيسية
if (!project) {
    alert('Project not found.');
    window.location.href = 'Homepage.html';
}

// ========== ثوابت ==========
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedStatus = ['New', 'Open', 'In Progress', 'Closed'];

// ترتيب المفاتيح لازم يطابق ترتيب أعمدة الجدول
const bugFields = [
    'id',
    'date',
    'reportedBy',
    'assignedTo',
    'severity',
    'priority',
    'status',
    'module',
    'environment',
    'description',
    'preCondition',
    'steps',
    'expected',
    'actual',
    'additional',
    'evidence',
    'reproducibility'
];

// ========== الدوال ==========
function saveProject() {
    localStorage.setItem('projects', JSON.stringify(projects));
}

function generateBugId() {
    project.bugCounter = (project.bugCounter || 0) + 1;
    return 'Bug-' + String(project.bugCounter).padStart(2, '0');
}

function fillAssigneeOptions() {
    const select = document.querySelector('#assigned-to');
    select.innerHTML = '<option value="">Unassigned</option>';

    project.employees.forEach(function (email) {
        const option = document.createElement('option');
        option.value = email;
        option.textContent = email;
        select.appendChild(option);
    });
}

function renderProjectInfo() {
    projectTitle.textContent = project.name;

    // الإيميلات تحت العنوان
    projectEmployees.innerHTML = '';
    project.employees.forEach(function (email) {
        const li = document.createElement('li');
        li.textContent = email;
        projectEmployees.appendChild(li);
    });

    // الحالة الحالية في القائمة
    statusSelect.value = project.status || 'Active';
}

function renderMembers() {
    membersList.innerHTML = '';

    project.employees.forEach(function (email) {
        const li = document.createElement('li');

        const span = document.createElement('span');
        span.textContent = email;

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'X';
        removeBtn.type = 'button';

        removeBtn.addEventListener('click', function () {
            project.employees = project.employees.filter(function (e) {
                return e !== email;
            });
            saveProject();
            renderMembers();
            renderProjectInfo();
        });

        li.appendChild(span);
        li.appendChild(removeBtn);
        membersList.appendChild(li);
    });

    fillAssigneeOptions();
    fillFilterAssignees();
}

function openHistory(bug) {
    historyTitle.textContent = 'History: ' + bug.id;
    historyList.innerHTML = '';

    const records = (bug.history || []).slice().reverse(); // الأحدث أول

    if (records.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No history recorded for this bug.';
        historyList.appendChild(li);
    }

    records.forEach(function (r) {
        const li = document.createElement('li');

        const text = document.createElement('span');
        if (r.action === 'Created' || r.action === 'Imported') {
            text.textContent = r.action + ' with status: ' + r.to;
        } else {
            text.textContent = r.action + ': ' + r.from + ' → ' + r.to;
        }

        const meta = document.createElement('small');
        meta.textContent = r.user + ' · ' + new Date(r.date).toLocaleString();

        li.appendChild(text);
        li.appendChild(meta);
        historyList.appendChild(li);
    });

    historyModal.classList.add('show');
}

function closeHistory() {
    historyModal.classList.remove('show');
}

function openModal() {
    modal.classList.add('show');
}

function closeModal() {
    modal.classList.remove('show');
}
function renderComments() {
    commentsList.innerHTML = '';

    const comments = currentCommentBug.comments || [];

    if (comments.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No comments yet.';
        commentsList.appendChild(li);
        return;
    }

    comments.forEach(function (c) {
        const li = document.createElement('li');

        const text = document.createElement('span');
        text.textContent = c.text;

        const meta = document.createElement('small');
        meta.textContent = c.user + ' · ' + new Date(c.date).toLocaleString();

        li.appendChild(text);
        li.appendChild(meta);
        commentsList.appendChild(li);
    });
}

function openComments(bug) {
    currentCommentBug = bug;
    commentsTitle.textContent = 'Comments: ' + bug.id;
    renderComments();
    commentsModal.classList.add('show');
}

function closeComments() {
    commentsModal.classList.remove('show');
    currentCommentBug = null;
}

// يلتقط كل @email من النص
function extractMentions(text) {
    const matches = text.match(/@([^\s@]+@[^\s@]+\.[^\s@]+)/g) || [];
    return matches.map(function (m) {
        return m.slice(1).toLowerCase();
    });
}
function fillFilterAssignees() {
    const previous = filterAssignee.value;

    filterAssignee.innerHTML =
        '<option value="">All</option>' +
        '<option value="__me__">Me</option>' +
        '<option value="__none__">Unassigned</option>';

    project.employees.forEach(function (email) {
        const option = document.createElement('option');
        option.value = email;
        option.textContent = email;
        filterAssignee.appendChild(option);
    });

    filterAssignee.value = previous;
}

function getVisibleBugs() {
    const me = (localStorage.getItem('currentUser') || '').toLowerCase();

    return project.bugs.filter(function (bug) {
        if (filterStatus.value && bug.status !== filterStatus.value) return false;
        if (filterSeverity.value && bug.severity !== filterSeverity.value) return false;

        const assignee = (bug.assignedTo || '').toLowerCase();

        if (filterAssignee.value === '__me__' && assignee !== me) return false;
        if (filterAssignee.value === '__none__' && assignee !== '') return false;
        if (filterAssignee.value &&
            filterAssignee.value !== '__me__' &&
            filterAssignee.value !== '__none__' &&
            assignee !== filterAssignee.value.toLowerCase()) return false;

        return true;
    });
}
function renderBugs() {
    bugsBody.innerHTML = '';

    getVisibleBugs().forEach(function (bug) {
        const tr = document.createElement('tr');

        bugFields.forEach(function (field) {
            const td = document.createElement('td');

            if (field === 'status') {
                // عمود الحالة: قائمة اختيار داخل الخلية
                const select = document.createElement('select');
                select.classList.add('status-select');

                allowedStatus.forEach(function (value) {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value;
                    select.appendChild(option);
                });

                select.value = bug.status;

                select.addEventListener('change', function () {
                    const oldStatus = bug.status;   // احفظ القديمة قبل التغيير
                    bug.status = select.value;

                    if (!bug.history) bug.history = [];

                    bug.history.push({
                        date: new Date().toISOString(),
                        user: localStorage.getItem('currentUser') || 'Unknown',
                        action: 'Status changed',
                        from: oldStatus,
                        to: select.value
                    });

                    saveProject();
                });

                td.appendChild(select);
            } else {
                td.textContent = bug[field] || '';
            }

            tr.appendChild(td);
        });

        // عمود Actions (الحذف)
        const actionTd = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.type = 'button';
        deleteBtn.classList.add('delete-btn');

        deleteBtn.addEventListener('click', function () {
            if (!confirm('Delete this bug?')) return;
            project.bugs = project.bugs.filter(function (b) {
                return b.id !== bug.id;
            });
            saveProject();
            renderBugs();
        });

        actionTd.appendChild(deleteBtn);
        tr.appendChild(actionTd);

        // عمود History
        const historyTd = document.createElement('td');
        const historyBtn = document.createElement('button');
        historyBtn.textContent = 'View';
        historyBtn.type = 'button';
        historyBtn.classList.add('history-btn');

        historyBtn.addEventListener('click', function () {
            openHistory(bug);
        });

        historyTd.appendChild(historyBtn);
        tr.appendChild(historyTd);
// عمود Comments
const commentsTd = document.createElement('td');
const commentsBtn = document.createElement('button');
commentsBtn.textContent = 'Comments (' + (bug.comments ? bug.comments.length : 0) + ')';
commentsBtn.type = 'button';
commentsBtn.classList.add('comments-btn');

commentsBtn.addEventListener('click', function () {
    openComments(bug);
});

commentsTd.appendChild(commentsBtn);
tr.appendChild(commentsTd);
        bugsBody.appendChild(tr);
    });
}

// تقسيم نص CSV لصفوف وأعمدة
function parseCSV(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];

        if (inQuotes) {
            if (ch === '"' && text[i + 1] === '"') {
                cell += '"';
                i++;
            } else if (ch === '"') {
                inQuotes = false;
            } else {
                cell += ch;
            }
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === ',') {
            row.push(cell);
            cell = '';
        } else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && text[i + 1] === '\n') i++;
            row.push(cell);
            rows.push(row);
            row = [];
            cell = '';
        } else {
            cell += ch;
        }
    }

    if (cell !== '' || row.length > 0) {
        row.push(cell);
        rows.push(row);
    }

    return rows;
}

// ========== الأحداث: المودال ==========
addBugBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', closeModal);

modal.addEventListener('click', function (event) {
    if (event.target === modal) {
        closeModal();
    }
});

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closeModal();
        closeHistory();
        closeComments();
    }
});

// ========== الأحداث: نافذة السجل ==========
historyClose.addEventListener('click', closeHistory);

historyModal.addEventListener('click', function (event) {
    if (event.target === historyModal) {
        closeHistory();
    }
});

// ========== الأحداث: فورم البق ==========
bugForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const fileInput = document.querySelector('#evidence-screenshot');
    const fileName = fileInput.files.length > 0 ? fileInput.files[0].name : '';

    const bug = {
        id: generateBugId(),
        date: document.querySelector('#date').value,
        reportedBy: document.querySelector('#reported-by').value.trim(),
        assignedTo: document.querySelector('#assigned-to').value.trim(),
        severity: document.querySelector('#severity').value,
        priority: document.querySelector('#priority').value,
        status: document.querySelector('#status').value,
        module: document.querySelector('#module').value.trim(),
        environment: document.querySelector('#environment').value.trim(),
        description: document.querySelector('#description').value.trim(),
        preCondition: document.querySelector('#pre-condition').value.trim(),
        steps: document.querySelector('#steps-to-reproduce').value.trim(),
        expected: document.querySelector('#expected-result').value.trim(),
        actual: document.querySelector('#actual-result').value.trim(),
        additional: document.querySelector('#additional-details').value.trim(),
        evidence: fileName, // نخزن اسم الملف فقط حالياً
        reproducibility: document.querySelector('#reproducibility-ratio').value.trim(),
        history: [
            {
                date: new Date().toISOString(),
                user: localStorage.getItem('currentUser') || 'Unknown',
                action: 'Created',
                to: document.querySelector('#status').value
            }
        ]
    };

    project.bugs.push(bug);

    // إشعار الإسناد
    if (bug.assignedTo) {
        addNotification(
            bug.assignedTo,
            project,
            'You were assigned ' + bug.id + ' in "' + project.name + '"',
            'assigned'
        );
    }

    saveProject();
    renderBugs();

    bugForm.reset();
    closeModal();
});

// ========== الأحداث: الأعضاء ==========
addMemberBtn.addEventListener('click', function () {
    const email = newMemberEmail.value.trim();

    if (!email) {
        alert('Please enter an email.');
        return;
    }

    if (!emailPattern.test(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    if (project.employees.includes(email)) {
        alert('This member is already added.');
        return;
    }

    project.employees.push(email);
    addNotification(email, project);
    saveProject();
    renderMembers();
    renderProjectInfo();

    newMemberEmail.value = '';
    newMemberEmail.focus();
});

// ========== الأحداث: حالة المشروع ==========
statusSelect.addEventListener('change', function () {
    project.status = statusSelect.value;
    saveProject();
});

// ========== الأحداث: حذف المشروع ==========
deleteProjectBtn.addEventListener('click', function () {
    const typed = prompt(
        'This will permanently delete "' + project.name + '" and its ' +
        project.bugs.length + ' bug(s).\n\nType the project name to confirm:'
    );

    if (typed !== project.name) {
        alert('Project name did not match. Nothing was deleted.');
        return;
    }

    const remaining = projects.filter(function (p) {
        return p.id !== project.id;
    });
    localStorage.setItem('projects', JSON.stringify(remaining));
    window.location.href = 'Homepage.html';
});

// ========== الأحداث: الاستيراد ==========
importBtn.addEventListener('click', function () {
    importFile.click();
});

importFile.addEventListener('change', function () {
    const file = importFile.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function () {
        const rows = parseCSV(reader.result).filter(function (r) {
            return r.join('').trim() !== ''; // تجاهل الأسطر الفاضية
        });

        // أول صف هو العناوين، نتجاوزه
        const dataRows = rows.slice(1);

        dataRows.forEach(function (r) {
            const bug = {
                id: generateBugId(),
                date: (r[0] || '').trim(),
                reportedBy: (r[1] || '').trim(),
                assignedTo: (r[2] || '').trim(),
                severity: (r[3] || '').trim(),
                priority: (r[4] || '').trim(),
                status: (r[5] || 'New').trim(),
                module: (r[6] || '').trim(),
                environment: (r[7] || '').trim(),
                description: (r[8] || '').trim(),
                preCondition: (r[9] || '').trim(),
                steps: (r[10] || '').trim(),
                expected: (r[11] || '').trim(),
                actual: (r[12] || '').trim(),
                additional: (r[13] || '').trim(),
                evidence: (r[14] || '').trim(),
                reproducibility: (r[15] || '').trim()
            };

            if (!allowedStatus.includes(bug.status)) bug.status = 'New';

            bug.history = [
                {
                    date: new Date().toISOString(),
                    user: localStorage.getItem('currentUser') || 'Unknown',
                    action: 'Imported',
                    to: bug.status
                }
            ];

            project.bugs.push(bug);
        });

        saveProject();
        renderBugs();
        alert(dataRows.length + ' bug(s) imported.');
        importFile.value = ''; // يسمح باستيراد نفس الملف مرة ثانية
    };

    reader.readAsText(file, 'UTF-8');
});

// ========== الأحداث: قائمة الإعدادات ==========
settingsBtn.addEventListener('click', function (event) {
    event.stopPropagation(); // يمنع الضغطة من الوصول للـ document
    settingsMenu.classList.toggle('show');
});

// الضغط داخل القائمة ما يقفلها
settingsMenu.addEventListener('click', function (event) {
    event.stopPropagation();
});

// الضغط في أي مكان برا يقفلها
document.addEventListener('click', function () {
    settingsMenu.classList.remove('show');
});
// ========== الأحداث: التعليقات ==========
commentsClose.addEventListener('click', closeComments);

commentsModal.addEventListener('click', function (event) {
    if (event.target === commentsModal) {
        closeComments();
    }
});

commentForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const text = commentText.value.trim();
    if (!text || !currentCommentBug) return;

    const me = localStorage.getItem('currentUser') || 'Unknown';

    if (!currentCommentBug.comments) currentCommentBug.comments = [];

    currentCommentBug.comments.push({
        id: Date.now() + Math.random(),
        user: me,
        text: text,
        date: new Date().toISOString()
    });

    // إشعار لكل شخص تم منشنه (عضو في المشروع، وليس الكاتب نفسه)
    const members = project.employees.map(function (e) { return e.toLowerCase(); });
    const notified = [];

    extractMentions(text).forEach(function (email) {
        if (!members.includes(email)) return;
        if (email === me.toLowerCase()) return;
        if (notified.includes(email)) return;

        notified.push(email);
        addNotification(
            email,
            project,
            me + ' mentioned you in a comment on ' + currentCommentBug.id + ' in "' + project.name + '"',
            'mention'
        );
    });

    saveProject();
    renderComments();
    renderBugs();            // لتحديث العدّاد على الزر
    commentText.value = '';
});
// ========== الأحداث: الفلاتر ==========
filterStatus.addEventListener('change', renderBugs);
filterSeverity.addEventListener('change', renderBugs);
filterAssignee.addEventListener('change', renderBugs);

filterReset.addEventListener('click', function () {
    filterStatus.value = '';
    filterSeverity.value = '';
    filterAssignee.value = '';
    renderBugs();
});
// ========== تشغيل الصفحة ==========
if (project) {
    renderProjectInfo();
    renderMembers();   // تستدعي fillAssigneeOptions() داخلها
    renderBugs();
}
