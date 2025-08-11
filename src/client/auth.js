document.addEventListener('DOMContentLoaded', () => {
    // Add a small, 100-millisecond delay to ensure the browser has time
    // to process the session cookie before we check the status.
    setTimeout(checkAuthStatus, 100); 
  });
  
  async function checkAuthStatus() {
    const authLinksContainer = document.getElementById('auth-links');
    const userDisplayContainer = document.getElementById('user-display');
    const authorsInfoContainer = document.getElementById('authors-info');
  
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();
  
      if (data.loggedIn) {
        authLinksContainer.classList.add('d-none');
        userDisplayContainer.classList.remove('d-none');
        userDisplayContainer.innerHTML = `
          <span class="navbar-text me-2">Welcome, ${data.user.firstName}!</span>
          <button id="logoutButton" class="btn btn-outline-danger">Logout</button>
        `;
        document.getElementById('logoutButton').addEventListener('click', async () => {
          await fetch('/api/auth/logout', { method: 'POST' });
          window.location.href = '/login.html';
        });
      } else {
        authLinksContainer.classList.remove('d-none');
        userDisplayContainer.classList.add('d-none');

        const authorsResponse = await fetch('/api/authors');
        const authors = await authorsResponse.json();

        if (authorsInfoContainer) {
            authorsInfoContainer.innerHTML = `
                <h2>Welcome to the Pokémon Battle Arena!</h2>
                <p>This project is a full-stack web application that allows you to explore the world of Pokémon.</p>
                <p>Created by:</p>
                <ul class="list-unstyled">
                    ${authors.map(author => `<li>${author.name} (${author.id})</li>`).join('')}
                </ul>
            `;
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  }