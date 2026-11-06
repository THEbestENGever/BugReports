function validateForm() {
const email = document.getElementById('email').value;
const password = document.getElementById('password').value;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!email || !password) {
alert("All fields are required!");
return false;
}

if (!emailPattern.test(email)) {
alert("Please enter a valid email address.");
return false;
}
localStorage.setItem('currentUser', email);
window.location.href = 'Homepage.html';
return false;
}
