document.addEventListener('DOMContentLoaded', async () => {
    const favoritesList = document.getElementById('favorites-list');
    const battleResults = document.getElementById('battle-results');

    try {
        const response = await fetch('/api/pokemon/favorites');
        const favorites = await response.json();

        if (favorites.length === 0) {
            favoritesList.innerHTML = '<p class="text-center">You have no favorite Pokémon to battle with. <a href="/index.html">Go find some!</a></p>';
            return;
        }

        favoritesList.innerHTML = ''; // Clear any previous list items

        favorites.forEach(pokemon => {
            const col = document.createElement('div');
            col.className = 'col-auto';

            const card = document.createElement('div');
            card.className = 'card text-center pokemon-card-clickable';
            card.style.width = '10rem';
            card.onclick = () => startBattle(pokemon.id);

            // Add the Pokémon's image
            const img = document.createElement('img');
            img.src = pokemon.image;

            // --- THIS IS THE FIX ---
            // Replaced 'card-img-top' with Bootstrap's centering classes 'mx-auto d-block'
            img.className = 'mx-auto d-block p-2';
            // --- END OF FIX ---
            
            img.alt = pokemon.name;
            img.style.width = '120px';
            img.style.height = '120px';
            img.style.objectFit = 'contain';

            const cardBody = document.createElement('div');
            cardBody.className = 'card-body p-2';
            const cardTitle = document.createElement('h6');
            cardTitle.className = 'card-title mb-0';
            cardTitle.textContent = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);

            // Assemble the card
            card.appendChild(img);
            cardBody.appendChild(cardTitle);
            card.appendChild(cardBody);
            col.appendChild(card);
            favoritesList.appendChild(col);
        });

    } catch (error) {
        console.error('Error loading favorites:', error);
        favoritesList.innerHTML = '<p class="text-danger text-center">An error occurred while loading your Pokémon.</p>';
    }
});

async function startBattle(playerPokemonId) {
    const battleResults = document.getElementById('battle-results');
    const favoritesList = document.getElementById('favorites-list');
    
    // Hide selection list and show a loading spinner
    favoritesList.style.display = 'none';
    battleResults.innerHTML = `<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Starting battle...</p></div>`;

    try {
        // Fetch player's selected Pokémon details
        const playerPokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${playerPokemonId}`);
        const playerPokemon = await playerPokemonResponse.json();

        // Fetch a random Pokémon for the bot
        const randomBotId = Math.floor(Math.random() * 898) + 1;
        const botPokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomBotId}`);
        const botPokemon = await botPokemonResponse.json();

        // Calculate scores
        const playerScore = calculateScore(playerPokemon.stats);
        const botScore = calculateScore(botPokemon.stats);

        // Determine winner and apply styling
        let winner, loser, playerCardClass, botCardClass;
        if (playerScore >= botScore) {
            winner = playerPokemon;
            loser = botPokemon;
            playerCardClass = 'border-warning'; // Winner highlight
            botCardClass = 'opacity-50';      // Loser fade
        } else {
            winner = botPokemon;
            loser = playerPokemon;
            playerCardClass = 'opacity-50';
            botCardClass = 'border-warning';
        }

        const winnerName = winner.name.charAt(0).toUpperCase() + winner.name.slice(1);

        // Display results with improved layout
        battleResults.innerHTML = `
            <h2 class="text-center mb-4">Battle Results</h2>
            <div class="row text-center justify-content-center">
                <div class="col-md-5 p-3 border rounded ${playerCardClass}">
                    <h3>You</h3>
                    <img src="${playerPokemon.sprites.front_default}" alt="${playerPokemon.name}" style="width: 150px;">
                    <h4>${playerPokemon.name.charAt(0).toUpperCase() + playerPokemon.name.slice(1)}</h4>
                </div>
                <div class="col-md-2 d-flex align-items-center justify-content-center">
                    <h1 class="display-4">VS</h1>
                </div>
                <div class="col-md-5 p-3 border rounded ${botCardClass}">
                    <h3>Bot</h3>
                    <img src="${botPokemon.sprites.front_default}" alt="${botPokemon.name}" style="width: 150px;">
                    <h4>${botPokemon.name.charAt(0).toUpperCase() + botPokemon.name.slice(1)}</h4>
                </div>
            </div>
            <div class="text-center mt-4">
                <h3 class="text-warning">Winner: ${winnerName} 👑</h3>
                <button class="btn btn-primary mt-3" onclick="window.location.reload()">Play Again</button>
            </div>
        `;
    } catch (error) {
        console.error('Error during battle:', error);
        battleResults.innerHTML = '<p class="text-danger text-center">Something went wrong during the battle. Please try again.</p>';
    }
}

function calculateScore(stats) {
    const getStat = (name) => stats.find(s => s.stat.name === name)?.base_stat || 0;
    const hp = getStat('hp');
    const attack = getStat('attack');
    const defense = getStat('defense');
    const speed = getStat('speed');
    
    // Formula from the project description
    return (hp * 0.3) + (attack * 0.4) + (defense * 0.2) + (speed * 0.1) + (Math.random() * 10);
}