import fs from 'fs-extra';
import path from 'path';
import bcrypt from 'bcrypt';

// Path to the users.json file
const usersFilePath = path.resolve('src/data/users.json');

// --- Register a New User ---
export const register = async (req, res) => {
  try {
    const { firstName, email, password } = req.body;

    // --- USERNAME VALIDATION ---
    if (firstName.length > 50) {
        return res.status(400).json({ message: 'Username must be less than 50 characters.' });
    }
    if (!/^[a-zA-Z\s]*$/.test(firstName)) {
        return res.status(400).json({ message: 'Username cannot contain numbers or special characters.' });
    }

    // --- PASSWORD VALIDATION ---
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{7,15}$/.test(password)) {
        return res.status(400).json({
            message: 'Password must be 7-15 characters long and include at least one uppercase letter, one lowercase letter, and one non-alphanumeric character.'
        });
    }


    // 1. Read existing users
    const users = await fs.readJson(usersFilePath);

    // 2. Check if user with that email already exists
    const userExists = users.find(user => user.email === email);
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // 3. Hash the password for security
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create the new user object
    const newUser = {
      id: users.length > 0 ? users[users.length - 1].id + 1 : 1, // Simple ID generation
      firstName,
      email,
      password: hashedPassword,
    };

    // 5. Add the new user to the array and save to the file
    users.push(newUser);
    await fs.writeJson(usersFilePath, users, { spaces: 2 });

    // 6. Send a success response
    res.status(201).json({ message: 'User registered successfully!' });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// --- Login an Existing User ---
export const login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // 1. Read existing users
      const users = await fs.readJson(usersFilePath);
  
      // 2. Find the user by email
      const user = users.find(u => u.email === email);
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password.' });
      }
  
      // 3. Compare the provided password with the stored hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password.' });
      }
  
      // 4. Create a session for the user
      // The password should not be stored in the session
      req.session.user = {
        id: user.id,
        firstName: user.firstName,
        email: user.email,
      };
  
      // 5. Explicitly save the session, then send the response
      req.session.save((err) => {
          if (err) {
            console.error('Session Save Error:', err);
            return res.status(500).json({ message: 'Server error during login.' });
          }
          // Now that the session is saved, send the success response
          res.status(200).json({ message: 'Login successful!', user: req.session.user });
        });
  
    } catch (error) {
      console.error('Login Error:', error);
      res.status(500).json({ message: 'Server error during login.' });
    }
  };

  // --- Logout a User ---
export const logout = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Could not log out, please try again.' });
      }
      // Clear the cookie and send a success response
      res.clearCookie('connect.sid'); // The default session cookie name
      res.status(200).json({ message: 'Logout successful.' });
    });
  };
  
  // --- Check Session Status ---
  export const getStatus = (req, res) => {
    if (req.session.user) {
      // If user is in session, send back user data
      res.status(200).json({ loggedIn: true, user: req.session.user });
    } else {
      // If not, indicate that no user is logged in
      res.status(200).json({ loggedIn: false });
    }
  };