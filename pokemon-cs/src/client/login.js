const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('error-message');

loginForm.addEventListener('submit', async function(event) {
  event.preventDefault();
  errorMessage.classList.add('d-none');
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const result = await response.json();
      errorMessage.textContent = result.message || 'Login failed.';
      errorMessage.classList.remove('d-none');
      return;
    }
    // Redirect on success
    window.location.href = '/index.html';
  } catch (error) {
    errorMessage.textContent = 'Could not connect to the server.';
    errorMessage.classList.remove('d-none');
  }
});