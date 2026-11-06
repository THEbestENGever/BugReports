const notificationsList = document.querySelector('#notifications-list');
const noNotifications = document.querySelector('#no-notifications');
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
function renderNotifications() {
    notificationsList.innerHTML = '';

    const myNotifications = getMyNotifications().reverse();

    if (myNotifications.length === 0) {
        noNotifications.style.display = 'block';
        return;
    }

    noNotifications.style.display = 'none';

    myNotifications.forEach(function (n) {
        const li = document.createElement('li');
        li.classList.add('notification-item');
         if (!n.read) {
         li.classList.add('unread');
        }
        li.addEventListener('click', function () {
       window.location.href = 'project.html?id=' + n.projectId;
        });
        const message = document.createElement('p');
        message.textContent = n.message;

        const time = document.createElement('small');
        time.textContent = new Date(n.createdAt).toLocaleString();

        li.appendChild(message);
        li.appendChild(time);
        notificationsList.appendChild(li);
    });
}

renderNotifications();
markAllAsRead();         // يعلّم الكل مقروء
updateNotifBadge(); 