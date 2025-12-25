import { Router } from 'express';
import { db } from '../db';
import type { User } from '../types';

const router = Router();

// Email validation regex
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Sanitize string input
const sanitizeString = (str: string): string => {
  return str.trim().slice(0, 500); // Limit length and trim whitespace
};

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Invalid input types' });
  }

  const sanitizedEmail = sanitizeString(email).toLowerCase();

  if (!isValidEmail(sanitizedEmail)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  const user = db.users.find(
    (u) => u.email.toLowerCase() === sanitizedEmail && u.password === password
  );

  if (user) {
    // In a real app, we would return a JWT token here
    // For this migration, we return the user object to be stored in client state
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _p, ...userWithoutPassword } = user;
    return res.json(userWithoutPassword);
  } else {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
});

// Signup
router.post('/signup', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Invalid input types' });
  }

  const sanitizedName = sanitizeString(name);
  const sanitizedEmail = sanitizeString(email).toLowerCase();

  if (sanitizedName.length < 2) {
    return res.status(400).json({ message: 'Name must be at least 2 characters long' });
  }

  if (!isValidEmail(sanitizedEmail)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  if (db.users.some((u) => u.email.toLowerCase() === sanitizedEmail)) {
    return res.status(409).json({ message: 'User with this email already exists' });
  }

  const newUser: User = {
    id: db.users.length + 1,
    name: sanitizedName,
    email: sanitizedEmail,
    password, // In a real app, hash this password!
    wishlist: [],
    orderHistory: [],
    favorites: [],
    isPlusMember: false,
  };

  db.users.push(newUser);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _p, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

// Update Profile
router.put('/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const { name, profilePictureUrl } = req.body;

  const userIndex = db.users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }

  const updatedUser = { ...db.users[userIndex] };
  if (name) updatedUser.name = name;
  if (profilePictureUrl) updatedUser.profilePictureUrl = profilePictureUrl;

  db.users[userIndex] = updatedUser;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _p, ...userWithoutPassword } = updatedUser;
  res.json(userWithoutPassword);
});

// Add to Wishlist
router.post('/:id/wishlist', (req, res) => {
  const userId = parseInt(req.params.id);
  const { productId } = req.body;
  const user = db.users.find((u) => u.id === userId);

  if (user) {
    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _p, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Remove from Wishlist
router.delete('/:id/wishlist/:productId', (req, res) => {
  const userId = parseInt(req.params.id);
  const productId = parseInt(req.params.productId);
  const user = db.users.find((u) => u.id === userId);

  if (user) {
    user.wishlist = user.wishlist.filter((id) => id !== productId);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _p, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Add to Favorites (Animals)
router.post('/:id/favorites', (req, res) => {
  const userId = parseInt(req.params.id);
  const { animalId } = req.body;
  const user = db.users.find((u) => u.id === userId);

  if (user) {
    if (!user.favorites.includes(animalId)) {
      user.favorites.push(animalId);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _p, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Remove from Favorites
router.delete('/:id/favorites/:animalId', (req, res) => {
  const userId = parseInt(req.params.id);
  const animalId = parseInt(req.params.animalId);
  const user = db.users.find((u) => u.id === userId);

  if (user) {
    user.favorites = user.favorites.filter((id) => id !== animalId);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _p, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Subscribe to Plus
router.post('/:id/subscribe', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = db.users.find((u) => u.id === userId);

  if (user) {
    user.isPlusMember = true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _p, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

export default router;
