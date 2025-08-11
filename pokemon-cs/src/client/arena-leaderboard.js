document.addEventListener('DOMContentLoaded', async () => {
    const leaderboardBody = document.getElementById('leaderboard-body');

    try {
        const response = await fetch('/api/leaderboard');
        if (!response.ok) {
            throw new Error('Failed to fetch leaderboard data.');
        }
        const { leaderboard, currentUserId } = await response.json();

        if (leaderboard.length === 0) {
            leaderboardBody.innerHTML = '<tr><td colspan="6" class="text-center">No players have completed enough battles to be ranked yet.</td></tr>';
            return;
        }

        leaderboard.forEach((player, index) => {
            const isCurrentUser = player.id === currentUserId;
            const row = document.createElement('tr');
            
            // Highlight the current user's row
            if (isCurrentUser) {
                row.classList.add('table-info');
            }

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${player.username}</td>
                <td>${player.totalBattles}</td>
                <td>${player.wins}</td>
                <td>${player.successRate.toFixed(2)}%</td>
                <td>${player.score}</td>
            `;
            leaderboardBody.appendChild(row);
        });

    } catch (error) {
        console.error("Leaderboard Error:", error);
        leaderboardBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Could not load leaderboard.</td></tr>`;
    }
});