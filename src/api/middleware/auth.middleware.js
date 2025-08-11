// In src/api/middleware/auth.middleware.js

export const isAuthenticated = (req, res, next) => {
  // If the user's session exists, they are logged in.
  if (req.session.user) {
    return next(); // Continue to the requested page or API endpoint.
  }

  // If the user is NOT logged in:
  // Check if the request is a browser trying to navigate to a page.
  if (req.accepts('html')) {
    // If so, redirect them to the login page.
    res.redirect('/login.html');
  } else {
    // Otherwise, it's an API call from our client-side JS.
    // Send a 401 Unauthorized error so the script can handle it.
    res.status(401).json({ message: 'Unauthorized' });
  }
};