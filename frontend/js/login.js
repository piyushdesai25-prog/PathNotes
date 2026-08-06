document.addEventListener('DOMContentLoaded', () => {
  // Already logged in? skip straight to dashboard.
  if (getSession()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const form = document.getElementById('login-form');
  const errorBox = document.getElementById('auth-error');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;

    const ok = login(username, password, remember);
    if (ok) {
      window.location.href = 'dashboard.html';
    } else {
      errorBox.classList.add('show');
    }
  });

  document.getElementById('forgot-link').addEventListener('click', (e) => {
    e.preventDefault();
    alert('Password reset links are sent by your branch administrator. Contact your Branch Manager to proceed.');
  });
});
