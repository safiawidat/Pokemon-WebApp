import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';

const favoritesDir = path.resolve('src/data/favorites');

// Ensure the favorites directory exists
fs.ensureDirSync(favoritesDir);

// Get the favorites for the logged-in user
export const getFavorites = async (req, res) => {
    // The user's ID is available from the session
    const userId = req.session.user.id;
    const userFavoritesPath = path.join(favoritesDir, `${userId}.json`);

    try {
        // Check if the user has a favorites file
        const userHasFavorites = await fs.pathExists(userFavoritesPath);
        if (!userHasFavorites) {
            // If not, they have no favorites yet, return an empty array
            return res.status(200).json([]);
        }

        // If the file exists, read the basic favorites list (id, name)
        const favorites = await fs.readJson(userFavoritesPath);
        if (!favorites || favorites.length === 0) {
            return res.json([]);
        }

        // For each favorited Pokémon, fetch its full data to get the image URL.
        const detailedFavorites = await Promise.all(
            favorites.map(async (pokemon) => {
                try {
                    const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemon.id}`);
                    return {
                        id: pokemon.id,
                        name: pokemon.name,
                        // This is the crucial part: adding the image from the API response
                        image: response.data.sprites.front_default
                    };
                } catch (apiError) {
                    console.error(`Failed to fetch data for Pokémon ID: ${pokemon.id}`, apiError);
                    // If the API call fails for one Pokémon, return the basic info so it doesn't crash everything
                    return { ...pokemon, image: null }; // or a placeholder image URL
                }
            })
        );
        // --- END: THE FIX ---

        // Send the new, detailed list (with images) to the client
        res.status(200).json(detailedFavorites);

    } catch (error) {
        console.error('Error getting favorites:', error);
        res.status(500).json({ message: 'Error retrieving favorites.' });
    }
};

// Add a new favorite for the logged-in user
export const addFavorite = async (req, res) => {
    const userId = req.session.user.id;
    const userFavoritesPath = path.join(favoritesDir, `${userId}.json`);
    const { pokemon } = req.body;

    try {
        let favorites = [];
        const userHasFavorites = await fs.pathExists(userFavoritesPath);
        if (userHasFavorites) {
            favorites = await fs.readJson(userFavoritesPath);
        }

        if (favorites.length >= 10) {
            return res.status(400).json({ message: 'You can only have up to 10 favorite Pokémon.' });
        }

        if (favorites.find(p => p.id === pokemon.id)) {
            return res.status(400).json({ message: 'This Pokémon is already in your favorites.' });
        }
        
        // IMPORTANT: Only store the id and name, not the whole pokemon object
        favorites.push({id: pokemon.id, name: pokemon.name});
        await fs.writeJson(userFavoritesPath, favorites, { spaces: 2 });
        res.status(201).json({ message: 'Pokémon added to favorites successfully!' });
    } catch (error) {
        console.error('Error adding favorite:', error);
        res.status(500).json({ message: 'Error adding favorite.' });
    }
};

// Remove a favorite for the logged-in user
export const removeFavorite = async (req, res) => {
    const userId = req.session.user.id;
    const userFavoritesPath = path.join(favoritesDir, `${userId}.json`);
    const pokemonId = parseInt(req.params.id, 10);

    try {
        const favorites = await fs.readJson(userFavoritesPath);
        const updatedFavorites = favorites.filter(p => p.id !== pokemonId);

        if (favorites.length === updatedFavorites.length) {
            return res.status(404).json({ message: 'Pokémon not found in favorites.' });
        }

        await fs.writeJson(userFavoritesPath, updatedFavorites, { spaces: 2 });
        res.status(200).json({ message: 'Pokémon removed from favorites successfully!' });
    } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({ message: 'Error removing favorite.' });
    }
};

// Get YouTube videos for a Pokémon
export const getPokemonVideos = async (req, res) => {
    const { pokemonName } = req.params;
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    const query = `${pokemonName} pokemon highlights`;

    if (!YOUTUBE_API_KEY) {
        return res.status(500).json({ message: 'YouTube API key is not configured.' });
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        query
    )}&key=${YOUTUBE_API_KEY}&type=video&maxResults=6`;

    try {
        const response = await axios.get(url);
        const videos = response.data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.default.url,
        }));
        res.json(videos);
    } catch (error) {
        console.error('Error fetching YouTube videos:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to fetch videos from YouTube.' });
    }
};