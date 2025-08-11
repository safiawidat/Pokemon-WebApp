import express from 'express';
import { getFavorites, addFavorite, removeFavorite, getPokemonVideos } from '../controllers/pokemon.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/pokemon/favorites

// The isAuthenticated middleware runs first. If the user is not logged in,
// it will send a 401 Unauthorized error and never call getFavorites.
router.get('/favorites', isAuthenticated, getFavorites);

// POST /api/pokemon/favorites
router.post('/favorites', isAuthenticated, addFavorite);

// DELETE /api/pokemon/favorites/:id
router.delete('/favorites/:id', isAuthenticated, removeFavorite); 

router.get('/videos/:pokemonName', isAuthenticated, getPokemonVideos);

export default router;