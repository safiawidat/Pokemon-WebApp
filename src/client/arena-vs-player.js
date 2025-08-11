document.addEventListener('DOMContentLoaded', () => {
    const onlineUsersList = document.getElementById('online-users-list');
    const battleArea = document.getElementById('battle-area');
    const startBattleContainer = document.getElementById('start-battle-container');
    const startBattleBtn = document.getElementById('start-battle-btn');

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${wsProtocol}//${window.location.host}`);

    let currentUserId = null;
    let onlineUsersCache = null;
    let battleData = null;

    socket.onopen = () => {
        console.log('WebSocket connection established.');
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'your_id') {
            currentUserId = data.userId;
            if (onlineUsersCache) {
                updateOnlineUsersList(onlineUsersCache);
                onlineUsersCache = null; 
            }
        }
        
        if (data.type === 'online_users') {
            if (currentUserId) {
                updateOnlineUsersList(data.users);
            } else {
                onlineUsersCache = data.users;
            }
        }

        if (data.type === 'challenge_received') {
            const accept = confirm(`${data.fromUsername} has challenged you to a battle! Do you accept?`);
            if (accept) {
                socket.send(JSON.stringify({ type: 'challenge_accepted', fromId: data.fromId, toId: currentUserId }));
            }
        }

        if (data.type === 'battle_ready') {
            battleData = data;
            onlineUsersList.parentElement.style.display = 'none'; 
            battleArea.innerHTML = `<h2 class="text-success">Battle Accepted! Get Ready!</h2>`;
            startBattleContainer.style.display = 'block';
        }

        if (data.type === 'battle_error') {
            battleArea.innerHTML = `<p class="text-danger">Error: ${data.message}</p>`;
        }
    };

    socket.onclose = () => {
        console.log('WebSocket connection closed.');
        onlineUsersList.innerHTML = '<li class="list-group-item text-danger">Connection lost. Please refresh.</li>';
    };

    startBattleBtn.addEventListener('click', () => {
        startBattleContainer.style.display = 'none';
        startCountdown();
    });

    function startCountdown() {
        let count = 3;
        battleArea.innerHTML = `<div class="countdown-text">${count}</div>`;
        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                battleArea.innerHTML = `<div class="countdown-text">${count}</div>`;
            } else {
                clearInterval(interval);
                battleArea.innerHTML = `<div class="countdown-text">BATTLE!</div>`;
                setTimeout(playAnimation, 1000);
            }
        }, 1000);
    }

    function playAnimation() {
        const { player1, player2, pokemon1, pokemon2, winnerId } = battleData;

        battleArea.innerHTML = `
            <div class="row text-center justify-content-center align-items-center">
                <div class="col-5">
                    <img id="pokemon1-animation-img" src="${pokemon1.image}" class="shake-animation" style="width: 200px;">
                </div>
                <div class="col-2"><h1 class="display-1">VS</h1></div>
                <div class="col-5">
                    <img id="pokemon2-animation-img" src="${pokemon2.image}" class="shake-animation" style="width: 200px;">
                </div>
            </div>
        `;

        setTimeout(() => {
            const pokemon1Img = document.getElementById('pokemon1-animation-img');
            const pokemon2Img = document.getElementById('pokemon2-animation-img');
            
            if (winnerId !== player1.id) {
                pokemon1Img.classList.add('grayscale');
            }
            if (winnerId !== player2.id) {
                pokemon2Img.classList.add('grayscale');
            }

            setTimeout(() => {
                renderBattle(battleData);
            }, 800);

        }, 1500); 
    }

    function updateOnlineUsersList(users) {
        onlineUsersList.innerHTML = '';
        const otherUsers = users.filter(user => user.id !== currentUserId);

        if (otherUsers.length === 0) {
            onlineUsersList.innerHTML = '<li class="list-group-item">No other players are online.</li>';
            return;
        }

        otherUsers.forEach(user => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.textContent = user.username;
            
            const challengeButton = document.createElement('button');
            challengeButton.className = 'btn btn-sm btn-primary';
            challengeButton.textContent = 'Challenge';
            challengeButton.onclick = () => challengePlayer(user.id);
            
            li.appendChild(challengeButton);
            onlineUsersList.appendChild(li);
        });
    }
    
    function challengePlayer(opponentId) {
        battleArea.innerHTML = `<p class="text-info">Challenge sent! Waiting for a response...</p>`;
        socket.send(JSON.stringify({ type: 'challenge', opponentId: opponentId }));
    }
});

function renderBattle(data) {
    const battleArea = document.getElementById('battle-area');
    const { player1, player2, pokemon1, pokemon2, winnerId } = data;
    
    let resultText = '';
    let player1CardClass = '';
    let player2CardClass = '';

    if (winnerId) {
        const winnerName = winnerId === player1.id ? player1.username : player2.username;
        resultText = `Winner: ${winnerName} 👑`;
        player1CardClass = winnerId === player1.id ? 'border-warning' : 'opacity-50';
        player2CardClass = winnerId === player2.id ? 'border-warning' : 'opacity-50';
    } else {
        resultText = "It's a Tie!";
        player1CardClass = 'border-info';
        player2CardClass = 'border-info';
    }

    const getStat = (stats, name) => {
        const stat = stats.find(s => s.stat.name === name);
        return stat ? stat.base_stat : 'N/A';
    };

    battleArea.innerHTML = `
        <h2 class="text-center mb-4">Battle Results</h2>
        <div class="row text-center">
            <div class="col-5 p-3 border rounded ${player1CardClass}">
                <h3>${player1.username}</h3>
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

            <div class="col-2 d-flex align-items-center justify-content-center">
                <h1 class="display-4">VS</h1>
            </div>

            <div class="col-5 p-3 border rounded ${player2CardClass}">
                <h3>${player2.username}</h3>
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
            <button class="btn btn-secondary mt-2" onclick="window.location.reload()">Find New Battle</button>
        </div>
    `;
}