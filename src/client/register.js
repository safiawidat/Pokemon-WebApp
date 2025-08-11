// Select the form and the error message element from the DOM
const registerForm = document.getElementById('registerForm');
const errorMessage = document.getElementById('error-message');

// Add a submit event listener to the form
registerForm.addEventListener('submit', async function(event) {
  // Prevent the default form submission behavior
  event.preventDefault();

  // Hide any previous error messages
  errorMessage.classList.add('d-none');

  // Get user input from the form fields
  const firstName = document.getElementById('firstName').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  // --- Client-Side Validation ---

  // Username validation
    if (firstName.length > 50) {
        showError('Username must be less than 50 characters.');
        return;
    }
    if (!/^[a-zA-Z\s]*$/.test(firstName)) {
        showError('Username cannot contain numbers or special characters.');
        return;
    }

  // Check if passwords match
  if (password !== confirmPassword) {
    showError('Passwords do not match.');
    return;
  }

  // Basic password policy check (as per project requirements)
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{7,15}$/.test(password)) {
        showError('Password must be 7-15 characters and include at least one uppercase letter, one lowercase letter, and one non-alphanumeric character.');
        return;
    }

  // --- API Call ---
  try {
    // Send a POST request to the registration API endpoint
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Convert the user data to a JSON string
      body: JSON.stringify({ firstName, email, password }),
    });

    const result = await response.json();

    // If the registration was not successful, show the error
    if (!response.ok) {
      showError(result.message || 'An error occurred during registration.');
      return;
    }

    // If successful, redirect to the login page
    alert('Registration successful! Please log in.');
    window.location.href = '/login.html'; // We will create login.html next

  } catch (error) {
    showError('Could not connect to the server. Please try again later.');
    console.error('Registration error:', error);
  }
});

// Helper function to display an error message
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('d-none');
}