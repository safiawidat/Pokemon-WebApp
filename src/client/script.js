const resultsDiv = document.getElementById("results");
const loader = document.getElementById("loader");

// Toggle visibility of the loading spinner
function showLoader(show) {
  loader.style.display = show ? "block" : "none";
}

// Generate a Bootstrap card HTML snippet for a single Pokémon object
function createCard(pokemon) {
  return `<div class="col-md-4">
    <div class="card p-3">
      <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" class="card-img-top mx-auto">
      <div class="card-body">
        <h5 class="card-title text-capitalize">${pokemon.name}</h5>
        <p class="card-text"><strong>ID:</strong> ${pokemon.id}</p>
        <p class="card-text"><strong>Types:</strong> ${pokemon.types.map(t => t.type.name).join(', ')}</p>
        <p class="card-text"><strong>Abilities:</strong> ${pokemon.abilities.map(a => a.ability.name).join(', ')}</p>
        <div class="card-buttons">
          <a href="details.html?id=${pokemon.id}" class="btn btn-info">View Details</a>
          <button class="btn btn-outline-success" onclick="addToFavorites(${pokemon.id})">Add to Favorites</button>
        </div>
      </div>
    </div>
  </div>`;
}

// Update the URL with the current search parameters (type, ability, id)
function updateQueryParams(type, ability, id) {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (ability) params.set("ability", ability);
  if (id) params.set("id", id);
  window.history.replaceState({}, "", `${location.pathname}?${params}`);
}

// Perform the Pokémon search logic based on user input and fetch results from PokéAPI
async function searchPokemon() {
  const type = document.getElementById("typeSelect").value.toLowerCase();
  const ability = document.getElementById("abilityInput").value.toLowerCase();
  const id = document.getElementById("idInput").value.trim();
  const name = document.getElementById("nameInput").value.trim().toLowerCase();

  updateQueryParams(type, ability, id);

  resultsDiv.innerHTML = "";
  showLoader(true);

  try {
    // Search by ID
    if (id) {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const data = await res.json();
      resultsDiv.innerHTML = createCard(data);
    // Search by Type
    } else if (type) {
      const res = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
      const data = await res.json();
      const pokes = data.pokemon.slice(0, 10);
      for (let p of pokes) {
        const pokeData = await fetch(p.pokemon.url);
        const pokeJson = await pokeData.json();
        resultsDiv.innerHTML += createCard(pokeJson);
      }
    // Search by Ability
    } else if (ability) {
      const res = await fetch(`https://pokeapi.co/api/v2/ability/${ability}`);
      const data = await res.json();
      const pokes = data.pokemon.slice(0, 10);
      for (let p of pokes) {
        const pokeData = await fetch(p.pokemon.url);
        const pokeJson = await pokeData.json();
        resultsDiv.innerHTML += createCard(pokeJson);

      }
      // Search by Name
    } else if (name){
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
      const data = await res.json();
      resultsDiv.innerHTML = createCard(data);
    }
     else {
      resultsDiv.innerHTML = '<p class="text-danger text-center">Please enter a search criteria.</p>';
    }
  } catch (error) {
    resultsDiv.innerHTML = '<p class="text-danger text-center">No Pokémon found or error occurred.</p>';
  }

  showLoader(false);
}
// Add a Pokémon to the favorites list by sending a request to the server
async function addToFavorites(id) {
  try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const pokemonData = await res.json();

      // Create a smaller object with just the essential info
      const favoritePokemon = {
          id: pokemonData.id,
          name: pokemonData.name,
          // You can add other essential properties here if needed
      };

      const response = await fetch('/api/pokemon/favorites', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pokemon: favoritePokemon }), // Send the smaller object
      });

      if (response.status === 401) {
          alert('You must be logged in to add favorites.');
          window.location.href = '/login.html';
          return;
      }

      const result = await response.json();

      if (!response.ok) {
          alert(result.message);
      } else {
          alert('Added to favorites!');
      }
  } catch (error) {
      console.error('Error adding to favorites:', error);
      alert('Could not add to favorites. Please try again later.');
  }
}

// Extract current search values from the URL query parameters
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    type: params.get("type") || "",
    ability: params.get("ability") || "",
    id: params.get("id") || ""
  };
}

// On page load, pre-fill input fields from URL and run search if any field is set
document.addEventListener("DOMContentLoaded", () => {
  const { type, ability, id } = getQueryParams();
  if (type) document.getElementById("typeSelect").value = type;
  if (ability) document.getElementById("abilityInput").value = ability;
  if (id) document.getElementById("idInput").value = id;

  if (type || ability || id) searchPokemon();
});