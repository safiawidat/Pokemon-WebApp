import fs from 'fs-extra';

const battlesFilePath = './src/data/battles.json';
const usersFilePath = './src/data/users.json';

export const getLeaderboard = async (req, res) => {
    try {
        const battles = await fs.readJson(battlesFilePath);
        const users = await fs.readJson(usersFilePath);

        const playerStats = {};

        // Initialize stats for all users
        users.forEach(user => {
            playerStats[user.id] = {
                id: user.id,
                username: user.firstName,
                wins: 0,
                losses: 0,
                totalBattles: 0,
                score: 0
            };
        });

        // Calculate stats from battles
        battles.forEach(battle => {
            if (playerStats[battle.winnerId]) {
                playerStats[battle.winnerId].wins++;
                playerStats[battle.winnerId].totalBattles++;
                playerStats[battle.winnerId].score += 3; // 3 points for a win
            }
            if (playerStats[battle.loserId]) {
                playerStats[battle.loserId].losses++;
                playerStats[battle.loserId].totalBattles++;
            }
        });

        // Convert to array and calculate success rate, filtering out players with fewer than 5 battles
        const leaderboard = Object.values(playerStats)
            .filter(player => player.totalBattles >= 5) // Must have at least 5 battles
            .map(player => ({
                ...player,
                successRate: player.totalBattles > 0 ? (player.wins / player.totalBattles) * 100 : 0
            }));

        // Sort by score (descending)
        leaderboard.sort((a, b) => b.score - a.score);

        res.status(200).json({ leaderboard, currentUserId: req.session.user.id });

    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({ message: "Server error." });
    }
};