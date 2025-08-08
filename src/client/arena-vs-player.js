document.addEventListener('DOMContentLoaded', () => {
    const onlineUsersList = document.getElementById('online-users-list');
    const battleArea = document.getElementById('battle-area');
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${wsProtocol}//${window.location.host}`);



    let currentUserId = null;
    let onlineUsersCache = null;



    socket.onopen = () => {
        console.log('WebSocket connection established.');
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // Server sends the current user's ID upon connection
        if (data.type === 'your_id') {
            currentUserId = data.userId;
            if (onlineUsersCache) {
                updateOnlineUsersList(onlineUsersCache);
                onlineUsersCache = null; // Clear the cache
            }
        }
        
        // Update the list of online users
        if (data.type === 'online_users') {
            // If we already have the user's ID, update the list as normal
            if (currentUserId) {
                updateOnlineUsersList(data.users);
            } else {
                // Otherwise, cache the list to process after we get the ID
                onlineUsersCache = data.users;
            }
        }

        // --- NEW: Handle Incoming Challenges ---
        if (data.type === 'challenge_received') {
            const accept = confirm(`${data.fromUsername} has challenged you to a battle! Do you accept?`);
            if (accept) {
                // If accepted, send a message back to the server
                socket.send(JSON.stringify({ type: 'challenge_accepted', fromId: data.fromId, toId: currentUserId }));
            }
        }

        if (data.type === 'battle_ready') {
            // Hide the online users list
            onlineUsersList.style.display = 'none';
            renderBattle(data);
        }
        if (data.type === 'battle_error') {
            battleArea.innerHTML = `<p class="text-danger">Error: ${data.message}</p>`;
        }
    };

    socket.onclose = () => {
        console.log('WebSocket connection closed.');
        onlineUsersList.innerHTML = '<li class="list-group-item text-danger">Connection lost. Please refresh.</li>';
    };

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
    
    // --- UPDATED: Send Challenge to Server ---
    function challengePlayer(opponentId) {
        battleArea.innerHTML = `<p class="text-info">Challenge sent! Waiting for a response...</p>`;
        socket.send(JSON.stringify({ type: 'challenge', opponentId: opponentId }));
    }
});

function renderBattle(data) {
    const battleArea = document.getElementById('battle-area');
    const { player1, player2, pokemon1, pokemon2, winnerId } = data;
    const isWinnerP1 = winnerId === player1.id;

    const getStat = (stats, name) => stats.find(s => s.stat.name === name).base_stat;

    battleArea.innerHTML = `
        <h2 class="text-center mb-4">Battle Arena</h2>
        <div class="row text-center">
            <div class="col-5 p-3 border rounded ${isWinnerP1 ? 'border-warning' : 'opacity-50'}">
                <h3>${player1.username} ${isWinnerP1 ? '👑' : ''}</h3>
                <img src="${pokemon1.image}" alt="${pokemon1.name}" style="width: 150px;">
                <h4>${pokemon1.name.charAt(0).toUpperCase() + pokemon1.name.slice(1)}</h4>
                <ul class="list-unstyled">
                    <li>HP: ${getStat(pokemon1.stats, 'hp')}</li>
                    <li>Attack: ${getStat(pokemon1.stats, 'attack')}</li>
                    <li>Defense: ${getStat(pokemon1.stats, 'defense')}</li>
                    <li>Speed: ${getStat(pokemon1.stats, 'speed')}</li>
                </ul>
            </div>

            <div class="col-2 d-flex align-items-center justify-content-center">
                <h1 class="display-4">VS</h1>
            </div>

            <div class="col-5 p-3 border rounded ${!isWinnerP1 ? 'border-warning' : 'opacity-50'}">
                <h3>${player2.username} ${!isWinnerP1 ? '👑' : ''}</h3>
                <img src="${pokemon2.image}" alt="${pokemon2.name}" style="width: 150px;">
                <h4>${pokemon2.name.charAt(0).toUpperCase() + pokemon2.name.slice(1)}</h4>
                 <ul class="list-unstyled">
                    <li>HP: ${getStat(pokemon2.stats, 'hp')}</li>
                    <li>Attack: ${getStat(pokemon2.stats, 'attack')}</li>
                    <li>Defense: ${getStat(pokemon2.stats, 'defense')}</li>
                    <li>Speed: ${getStat(pokemon2.stats, 'speed')}</li>
                </ul>
            </div>
        </div>
        <div class="text-center mt-4">
            <h3 class="text-warning">Winner: ${isWinnerP1 ? player1.username : player2.username}!</h3>
        </div>
    `;
}