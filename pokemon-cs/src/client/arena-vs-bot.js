document.addEventListener('DOMContentLoaded', async () => {
    const battleResults = document.getElementById('battle-results');
    const startBattleContainer = document.getElementById('start-battle-container');
    const startBattleBtn = document.getElementById('start-battle-btn');
    const instructionText = document.getElementById('instruction-text');
    
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${wsProtocol}//${window.location.host}`);
    
    socket.onopen = () => console.log('WebSocket connection established for bot battle.');

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'battle_ready') {
            startBattleContainer.style.display = 'none';
            instructionText.style.display = 'none';
            playAnimation(data);
        }

        if (data.type === 'battle_error') {
            battleResults.innerHTML = `<p class="text-danger">${data.message}</p>`;
        }
    };

    startBattleBtn.addEventListener('click', () => {
        startBattleBtn.disabled = true;
        startCountdown();
    });

    function startCountdown() {
        let count = 3;
        battleResults.innerHTML = `<div class="countdown-text">${count}</div>`;
        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                battleResults.innerHTML = `<div class="countdown-text">${count}</div>`;
            } else {
                clearInterval(interval);
                battleResults.innerHTML = `<div class="countdown-text">BATTLE!</div>`;
                socket.send(JSON.stringify({ type: 'start_bot_battle' }));
            }
        }, 1000);
    }
});

function playAnimation(battleData) {
    const battleResults = document.getElementById('battle-results');
    const { player1, player2, pokemon1, pokemon2, winnerId } = battleData;

    battleResults.innerHTML = `
        <div class="row text-center justify-content-center align-items-center">
            <div class="col-5">
                <img id="player-pokemon-img" src="${pokemon1.image}" class="shake-animation" style="width: 200px;">
            </div>
            <div class="col-2"><h1 class="display-1">VS</h1></div>
            <div class="col-5">
                <img id="bot-pokemon-img" src="${pokemon2.image}" class="shake-animation" style="width: 200px;">
            </div>
        </div>
    `;

    setTimeout(() => {
        const playerImg = document.getElementById('player-pokemon-img');
        const botImg = document.getElementById('bot-pokemon-img');

        if (winnerId !== player1.id) { // Player loses or ties
            playerImg.classList.add('grayscale');
        }
        if (winnerId !== player2.id) { // Bot loses or ties
            botImg.classList.add('grayscale');
        }

        setTimeout(() => {
            renderBattleResults(battleData);
        }, 800);

    }, 1500);
}


function renderBattleResults(data) {
    const battleResults = document.getElementById('battle-results');
    const { player1, player2, pokemon1, pokemon2, winnerId } = data;
    
    let resultText = '';
    let playerCardClass = '';
    let botCardClass = '';

    if (winnerId) {
        const winnerName = winnerId === player1.id ? player1.username : player2.username;
        resultText = `Winner: ${winnerName} 👑`;
        playerCardClass = winnerId === player1.id ? 'border-warning' : 'opacity-50';
        botCardClass = winnerId === player2.id ? 'border-warning' : 'opacity-50';
    } else {
        resultText = "It's a Tie!";
        playerCardClass = 'border-info';
        botCardClass = 'border-info';
    }

    const getStat = (stats, name) => {
        const stat = stats.find(s => s.stat.name === name);
        return stat ? stat.base_stat : 'N/A';
    };

    battleResults.innerHTML = `
        <h2 class="text-center mb-4">Battle Results</h2>
        <div class="row text-center justify-content-center">
            <div class="col-md-5 p-3 border rounded ${playerCardClass}">
                <h3>You</h3>
                <img src="${pokemon1.image}" alt="${pokemon1.name}" style="width: 150px;">
                <h4>${pokemon1.name.charAt(0).toUpperCase() + pokemon1.name.slice(1)}</h4>
                <ul class="list-unstyled">
                    <li>HP: ${getStat(pokemon1.stats, 'hp')}</li>
                    <li>Attack: ${getStat(pokemon1.stats, 'attack')}</li>
                    <li>Defense: ${getStat(pokemon1.stats, 'defense')}</li>
                    <li>Speed: ${getStat(pokemon1.stats, 'speed')}</li>
                    <li>Special Attack: ${getStat(pokemon1.stats, 'special-attack')}</li>
                    <li>Special Defense: ${getStat(pokemon1.stats, 'special-defense')}</li>
                </ul>
            </div>
            <div class="col-md-2 d-flex align-items-center justify-content-center">
                <h1 class="display-4">VS</h1>
            </div>
            <div class="col-md-5 p-3 border rounded ${botCardClass}">
                <h3>Bot</h3>
                <img src="${pokemon2.image}" alt="${pokemon2.name}" style="width: 150px;">
                <h4>${pokemon2.name.charAt(0).toUpperCase() + pokemon2.name.slice(1)}</h4>
                <ul class="list-unstyled">
                    <li>HP: ${getStat(pokemon2.stats, 'hp')}</li>
                    <li>Attack: ${getStat(pokemon2.stats, 'attack')}</li>
                    <li>Defense: ${getStat(pokemon2.stats, 'defense')}</li>
                    <li>Speed: ${getStat(pokemon2.stats, 'speed')}</li>
                    <li>Special Attack: ${getStat(pokemon2.stats, 'special-attack')}</li>
                    <li>Special Defense: ${getStat(pokemon2.stats, 'special-defense')}</li>
                </ul>
            </div>
        </div>
        <div class="text-center mt-4">
            <h3 class="text-warning">${resultText}</h3>
            <button class="btn btn-primary mt-3" onclick="window.location.reload()">Play Again</button>
        </div>
    `;
}