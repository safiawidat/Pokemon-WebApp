import fs from 'fs-extra';

const battlesFilePath = './src/data/battles.json';
const usersFilePath = './src/data/users.json';

export const getLeaderboard = async (req, res) => {
    try {
        const battles = await fs.readJson(battlesFilePath);
        const users = await fs.readJson(usersFilePath);

        const playerStats = {};

        users.forEach(user => {
            playerStats[user.id] = {
                id: user.id,
                username: user.firstName,
                wins: 0,
                losses: 0,
                ties: 0,
                totalBattles: 0,
                score: 0
            };
        });

        battles.forEach(battle => {
            const { player1Id, player2Id, winnerId } = battle;

            if (playerStats[player1Id]) {
                playerStats[player1Id].totalBattles++;
            }
            if (playerStats[player2Id] && player2Id !== 'BOT') {
                playerStats[player2Id].totalBattles++;
            }

            if (winnerId) {
                if (playerStats[winnerId]) {
                    playerStats[winnerId].wins++;
                    playerStats[winnerId].score += 3;
                }
                const loserId = winnerId === player1Id ? player2Id : player1Id;
                if (playerStats[loserId] && loserId !== 'BOT') {
                    playerStats[loserId].losses++;
                }
            } else { // Tie
                if (playerStats[player1Id]) {
                    playerStats[player1Id].ties++;
                    playerStats[player1Id].score += 1;
                }
                if (playerStats[player2Id] && player2Id !== 'BOT') {
                    playerStats[player2Id].ties++;
                    playerStats[player2Id].score += 1;
                }
            }
        });

        const leaderboard = Object.values(playerStats)
            .filter(player => player.totalBattles >= 5)
            .map(player => ({
                ...player,
                successRate: player.totalBattles > 0 ? (player.wins / player.totalBattles) * 100 : 0
            }));

        leaderboard.sort((a, b) => b.score - a.score);

        res.status(200).json({ leaderboard, currentUserId: req.session.user.id });

    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({ message: "Server error." });
    }
};