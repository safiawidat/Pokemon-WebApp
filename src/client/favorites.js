// src/client/favorites.js

document.addEventListener('DOMContentLoaded', () => {
  loadFavoritesFromServer();
  // Add event listener for the download button
  const downloadBtn = document.getElementById('download-btn');
  if(downloadBtn) {
      downloadBtn.addEventListener('click', downloadFavorites);
  }
});

const favoritesDiv = document.getElementById('favorites');

// --- Load Favorites from Server & Fetch Full Details ---
async function loadFavoritesFromServer() {
  if (!favoritesDiv) return;
  favoritesDiv.innerHTML = '<p class="text-center">Loading your favorites...</p>';

  try {
      // 1. Get the list of lean favorite objects from your server
      const response = await fetch('/api/pokemon/favorites');

      if (response.status === 401) {
          alert('You must be logged in to view your favorites.');
          window.location.href = '/login.html';
          return;
      }

      if (!response.ok) {
          throw new Error('Could not retrieve favorites from the server.');
      }

      const favorites = await response.json();

      if (favorites.length === 0) {
          favoritesDiv.innerHTML = '<p class="text-center">No favorites added yet.</p>';
          return;
      }

      // 2. Fetch the full details for each favorite from the PokeAPI
      const pokemonPromises = favorites.map(pokemon =>
          fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.id}`).then(res => res.json())
      );

      const pokemonDetails = await Promise.all(pokemonPromises);

      // Clear previous content
      favoritesDiv.innerHTML = '';

      // 3. Render the cards with the full details
      pokemonDetails.forEach(pokemon => {
          const card = createFavoriteCard(pokemon);
          favoritesDiv.appendChild(card);
      });

  } catch (error) {
      console.error('Error loading favorites:', error);
      favoritesDiv.innerHTML = '<p class="text-danger text-center">Failed to load favorites.</p>';
  }
}

// --- Creates the HTML for a single favorite Pokémon card ---
// --- Creates the HTML for a single favorite Pokémon card ---
function createFavoriteCard(pokemon) {
  const card = document.createElement('div');
  card.className = 'col-md-4 mb-4';
  card.innerHTML = `
    <div class="card p-3 h-100">
      <img src="${pokemon.sprites.front_default}" class="card-img-top mx-auto" style="width: 96px; height: 96px;" alt="${pokemon.name}">
      <div class="card-body text-center">
        <h5 class="card-title text-capitalize">${pokemon.name}</h5>
        <p class="card-text">ID: ${pokemon.id}</p>
        
        <a href="/details.html?id=${pokemon.id}" class="btn btn-primary btn-sm">View Details</a>
        <button class="btn btn-danger btn-sm" onclick="removeFavorite(${pokemon.id})">Remove</button>

      </div>
    </div>
  `;
  return card;
}
// --- Removes a favorite Pokémon ---
async function removeFavorite(id) {
  if (!confirm('Are you sure you want to remove this Pokémon from your favorites?')) {
      return;
  }
  try {
      const response = await fetch(`/api/pokemon/favorites/${id}`, {
          method: 'DELETE',
      });
      if (!response.ok) {
          throw new Error('Server responded with an error.');
      }
      // Reload the favorites to show the change
      loadFavoritesFromServer();
  } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Failed to remove favorite.');
  }
}


// --- Download the list of favorites as a JSON file ---
function downloadFavorites() {
  // This function will download the lean list from your server, which is efficient
  fetch('/api/pokemon/favorites')
      .then(response => {
          if (!response.ok) {
              throw new Error('Could not fetch favorites for download.');
          }
          return response.json();
      })
      .then(favorites => {
          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(favorites, null, 2));
          const downloadAnchorNode = document.createElement('a');
          downloadAnchorNode.setAttribute("href", dataStr);
          downloadAnchorNode.setAttribute("download", "favorites.json");
          document.body.appendChild(downloadAnchorNode);
          downloadAnchorNode.click();
          downloadAnchorNode.remove();
      })
      .catch(error => {
          console.error('Error downloading favorites:', error);
          alert('Could not download favorites. Please try again later.');
      });
}