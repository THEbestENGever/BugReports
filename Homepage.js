// ========== اختيار العناصر ==========
const userBtn = document.querySelector('.user-btn');
const dropdown = document.querySelector('.dropdown');
const createBtn = document.querySelector('.create-bug-report');
const modal = document.querySelector('#outer-div');
const closeBtn = document.querySelector('.close-btn');
const addEmployeeBtn = document.querySelector('.add-employee-btn');
const employeeInput = document.querySelector('#employee-email');
const employeeList = document.querySelector('.employee-list');
const bugForm = document.querySelector('#bug-form');
const projectInput = document.querySelector('#project-name');

// قائمة الإيميلات المضافة
const employees = [];

// ========== القائمة المنسدلة ==========
userBtn.addEventListener('click', function (event) {
    event.stopPropagation(); // يمنع الضغطة من الوصول للـ document
    dropdown.classList.toggle('show');
});

// إغلاق القائمة لو ضغط المستخدم في أي مكان ثاني
document.addEventListener('click', function () {
    dropdown.classList.remove('show');
});

// ========== فتح وإغلاق المودال ==========
function openModal() {
    modal.classList.add('show');
}

function closeModal() {
    modal.classList.remove('show');
}

createBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', closeModal);

// إغلاق المودال لو ضغط على الخلفية المعتمة نفسها
modal.addEventListener('click', function (event) {
    if (event.target === modal) {
        closeModal();
    }
});

// ========== إضافة موظف ==========
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

addEmployeeBtn.addEventListener('click', function () {
    const email = employeeInput.value.trim();

    if (!email) {
        alert('Please enter an email.');
        return;
    }

    if (!emailPattern.test(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    if (employees.includes(email)) {
        alert('This employee is already added.');
        return;
    }

    employees.push(email);

    const li = document.createElement('li');
    li.textContent = email;

    const button = document.createElement('button');
    button.textContent = 'X';
    button.type = 'button';
    button.classList.add('remove-btn');

    button.addEventListener('click', function () {
        li.remove();
        const index = employees.indexOf(email);
        employees.splice(index, 1);
    });

    li.appendChild(button);
    employeeList.appendChild(li);

    employeeInput.value = '';
    employeeInput.focus();
});

// ========== إنشاء التقرير ==========
bugForm.addEventListener('submit', function (event) {
    event.preventDefault(); // يمنع إعادة تحميل الصفحة

    const projectName = projectInput.value.trim();

    if (!projectName) {
        alert('Please enter a project name.');
        return;
    }
const project = {
    id: Date.now(),
    name: projectName,
    employees: [...employees],
    bugs: [],
    bugCounter: 0,
    createdAt: new Date().toISOString()
};
const projects = JSON.parse(localStorage.getItem('projects')) || [];
projects.push(project);
project.employees.forEach(function (email) {
    addNotification(email, project);
});
localStorage.setItem('projects', JSON.stringify(projects));
window.location.href = 'project.html?id=' + project.id;

    // تنظيف الفورم وإغلاق المودال
    bugForm.reset();
    employees.length = 0;
    employeeList.innerHTML = '';
    closeModal();
});
// ========== عرض المشاريع ==========
const projectsGrid = document.querySelector('#projects-grid');

function renderProjects() {
    const projects = JSON.parse(localStorage.getItem('projects')) || [];

    projects.forEach(function (project) {
        const card = document.createElement('a');
        card.classList.add('project-card');
        card.href = 'project.html?id=' + project.id;

         const header = document.createElement('div');
        header.classList.add('card-header');

        const title = document.createElement('h3');
        title.textContent = project.name;

          const badge = document.createElement('span');
        badge.classList.add('badge', 'badge-' + (project.status || 'Active').toLowerCase());
        badge.textContent = project.status || 'Active';

        header.appendChild(title);
        header.appendChild(badge);

        const bugs = document.createElement('p');
        bugs.textContent = 'Bugs: ' + project.bugs.length;

        const date = document.createElement('p');
        const created = new Date(project.createdAt || project.id);
        date.textContent = 'Created: ' + created.toLocaleDateString();


        // ===== ترتيب العناصر داخل البطاقة =====
        card.appendChild(header);
       
        card.appendChild(bugs);
        card.appendChild(date);
   

        projectsGrid.appendChild(card);
    });
}

renderProjects();