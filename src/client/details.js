// src/client/details.js

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const pokemonId = params.get('id');
  
    if (pokemonId) {
      console.log(`Page loaded for Pokémon ID: ${pokemonId}`);
      loadPokemonDetails(pokemonId);
    } else {
      console.error('No Pokémon ID found in URL.');
      document.getElementById('pokemon-details').innerHTML = `<p class="text-danger">Error: No Pokémon ID specified.</p>`;
    }
  });
  
  async function loadPokemonDetails(id) {
    try {
      console.log(`Fetching details for Pokémon ID: ${id}`);
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      if (!response.ok) {
          throw new Error(`Failed to fetch Pokémon details. Status: ${response.status}`);
      }
      
      const pokemon = await response.json();
      console.log('Successfully fetched Pokémon details:', pokemon);
      displayPokemonDetails(pokemon);
      // This is the important call to our video function
      loadAndDisplayVideos(pokemon.name);
    } catch (error) {
      console.error('Error in loadPokemonDetails:', error);
      document.getElementById('pokemon-details').innerHTML = `<p class="text-danger">Could not load Pokémon details.</p>`;
    }
  }
  
  function displayPokemonDetails(pokemon) {
    const detailsDiv = document.getElementById('pokemon-details');
    if (!detailsDiv) {
        console.error('HTML element with ID "pokemon-details" not found!');
        return;
    }

    const getStat = (statName) => {
        const stat = pokemon.stats.find(s => s.stat.name === statName);
        return stat ? stat.base_stat : 'N/A';
    };

    detailsDiv.innerHTML = `
      <h2 class="text-capitalize">${pokemon.name}</h2>
      <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" style="width: 150px;">
      <p><strong>ID:</strong> ${pokemon.id}</p>
      <p><strong>Type:</strong> ${pokemon.types.map(t => t.type.name).join(', ')}</p>
      <p><strong>Height:</strong> ${pokemon.height / 10} m</p>
      <p><strong>Weight:</strong> ${pokemon.weight / 10} kg</p>
      
      <h4 class="mt-3">Base Stats</h4>
      <ul class="list-group">
          <li class="list-group-item d-flex justify-content-between align-items-center">
              HP
              <span class="badge bg-primary rounded-pill">${getStat('hp')}</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
              Attack
              <span class="badge bg-danger rounded-pill">${getStat('attack')}</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
              Defense
              <span class="badge bg-secondary rounded-pill">${getStat('defense')}</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
              Speed
              <span class="badge bg-info rounded-pill">${getStat('speed')}</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
              Special Attack
              <span class="badge bg-warning text-dark rounded-pill">${getStat('special-attack')}</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
              Special Defense
              <span class="badge bg-success rounded-pill">${getStat('special-defense')}</span>
          </li>
      </ul>
    `;
  }
  
  async function loadAndDisplayVideos(pokemonName) {
    const videosContainer = document.getElementById('videos-container');
     if (!videosContainer) {
        console.error('HTML element with ID "videos-container" not found!');
        return;
    }
    videosContainer.innerHTML = '<p>Loading videos...</p>';
    console.log(`Attempting to fetch videos for: ${pokemonName}`);
    
    try {
      const response = await fetch(`/api/pokemon/videos/${pokemonName}`);
      console.log('Response from our server for videos:', response);
  
      if (!response.ok) {
          const errorData = await response.json();
          console.error('Server returned an error:', errorData);
          throw new Error(errorData.message || `Server error: ${response.status}`);
      }
  
      const videos = await response.json();
      console.log('Successfully fetched videos from server:', videos);
  
      if (!Array.isArray(videos) || videos.length === 0) {
        console.log('No videos were found or the data is not an array.');
        videosContainer.innerHTML = '<p>No related videos found.</p>';
        return;
      }
  
      videosContainer.innerHTML = '';
      videos.forEach(video => {
        const videoElement = document.createElement('div');
        videoElement.className = 'col-md-4 mb-3';
        videoElement.innerHTML = `
          <div class="card">
            <a href="https://www.youtube.com/watch?v=${video.id}" target="_blank" rel="noopener noreferrer">
              <img src="${video.thumbnail}" class="card-img-top" alt="${video.title}">
            </a>
            <div class="card-body">
              <p class="card-text" style="font-size: 0.8rem;">${video.title}</p>
            </div>
          </div>
        `;
        videosContainer.appendChild(videoElement);
      });
  
    } catch (error) {
      console.error('Error in loadAndDisplayVideos:', error);
      videosContainer.innerHTML = `<p class="text-danger">Could not load videos. Check the console for details.</p>`;
    }
  }