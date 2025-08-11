import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import { WebSocketServer } from 'ws';
import authRoutes from './src/api/routes/auth.routes.js';
import pokemonRoutes from './src/api/routes/pokemon.routes.js';
import { isAuthenticated } from './src/api/middleware/auth.middleware.js';
import leaderboardRoutes from './src/api/routes/leaderboard.routes.js';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import axios from 'axios';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3003;

// --- START: BATTLE LIMIT HELPERS ---

const BATTLES_FILE = './src/data/battles.json';

/**
 * Checks if a user has reached their daily battle limit of 5.
 * @param {string} userId The ID of the user to check.
 * @returns {Promise<boolean>} True if the user can battle, false otherwise.
 */
async function canBattle(userId) {
    await fs.ensureFile(BATTLES_FILE);
    const battles = await fs.readJson(BATTLES_FILE, { throws: false }) || [];
    const today = new Date().setHours(0, 0, 0, 0);

    const battlesToday = battles.filter(battle => {
        const isParticipant = battle.player1Id === userId || battle.player2Id === userId;
        if (!isParticipant) return false;
        const battleDate = new Date(battle.timestamp).setHours(0, 0, 0, 0);
        return battleDate === today;
    }).length;

    console.log(`User ${userId} has had ${battlesToday} battles today.`);
    return battlesToday < 5;
}

// --- END: BATTLE LIMIT HELPERS ---


app.use(express.json());

const sessionParser = session({
    secret: 'a-very-good-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true, sameSite: 'lax' }
});

app.use(sessionParser);

app.use([
    '/details.html',
    '/favorites.html',
    '/arena.html',
    '/arena-vs-bot.html',
    '/arena-vs-player.html',
    '/arena-leaderboard.html'
], isAuthenticated);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/src/client', express.static(path.join(__dirname, 'src/client')));
app.use('/api/auth', authRoutes);
app.use('/api/pokemon', pokemonRoutes);
app.use('/api/leaderboard', isAuthenticated, leaderboardRoutes);

app.get('/api/authors', async (req, res) => {
    try {
        const authors = await fs.readJson('./src/data/authers.json');
        res.json(authors);
    } catch (error) {
        res.status(500).send('Error reading author data');
    }
});


const server = app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

const wss = new WebSocketServer({ noServer: true });

const onlineUsers = new Map();

server.on('upgrade', (request, socket, head) => {
    sessionParser(request, {}, () => {
        if (!request.session.user) {
            socket.destroy();
            return;
        }
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });
});


async function runBattle(player1Id, player2Id) {
    try {
        const favoritesP1 = await fs.readJson(`./src/data/favorites/${player1Id}.json`);
        const favoritesP2 = player2Id === 'BOT' ? [] : await fs.readJson(`./src/data/favorites/${player2Id}.json`);

        if (player1Id !== 'BOT' && favoritesP1.length === 0) {
            return { error: "You have no favorite Pokémon." };
        }
        if (player2Id !== 'BOT' && favoritesP2.length === 0) {
            return { error: "Opponent has no favorite Pokémon." };
        }
        
        const randomPokemonP1 = favoritesP1[Math.floor(Math.random() * favoritesP1.length)];

        let randomPokemonP2;
        if (player2Id === 'BOT') {
            const botPokemonId = Math.floor(Math.random() * 898) + 1;
            const botResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon/${botPokemonId}`);
            randomPokemonP2 = botResponse.data;
        } else {
            randomPokemonP2 = favoritesP2[Math.floor(Math.random() * favoritesP2.length)];
        }


        const p1DataPromise = axios.get(`https://pokeapi.co/api/v2/pokemon/${randomPokemonP1.id}`);
        const p2DataPromise = player2Id === 'BOT' ? Promise.resolve({ data: randomPokemonP2 }) : axios.get(`https://pokeapi.co/api/v2/pokemon/${randomPokemonP2.id}`);
        const [p1Response, p2Response] = await Promise.all([p1DataPromise, p2DataPromise]);
        
        const pokemon1 = p1Response.data;
        const pokemon2 = p2Response.data;

        const calculateScore = (stats) => {
            const getStat = (name) => stats.find(s => s.stat.name === name).base_stat;
            return (getStat('hp') * 0.3) + (getStat('attack') * 0.4) + (getStat('defense') * 0.2) + (getStat('speed') * 0.1) + Math.random();
        };
        const score1 = calculateScore(pokemon1.stats);
        const score2 = calculateScore(pokemon2.stats);

        let winnerId = null;
        if (score1 > score2) {
            winnerId = player1Id;
        } else if (score2 > score1) {
            winnerId = player2Id;
        }

        const battles = await fs.readJson(BATTLES_FILE, { throws: false }) || [];
        battles.push({
            player1Id,
            player2Id,
            winnerId, // Can be null for a tie
            timestamp: new Date().toISOString()
        });
        await fs.writeJson(BATTLES_FILE, battles, { spaces: 2 });

        return {
            pokemon1: { name: pokemon1.name, image: pokemon1.sprites.front_default, stats: pokemon1.stats },
            pokemon2: { name: pokemon2.name, image: pokemon2.sprites.front_default, stats: pokemon2.stats },
            winnerId: winnerId
        };
    } catch (error) {
        console.error("Error running battle:", error);
        return { error: "Could not start the battle." };
    }
}


wss.on('connection', (ws, req) => {
    const userId = req.session.user.id;
    const username = req.session.user.firstName;

    onlineUsers.set(userId, { username, ws });
    console.log(`User ${username} connected.`);
    broadcastOnlineUsers();

    ws.on('close', () => {
        onlineUsers.delete(userId);
        console.log(`User ${username} disconnected.`);
        broadcastOnlineUsers();
    });

    ws.on('message', async (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'challenge': {
                const challengerId = userId;
                const opponentId = data.opponentId;

                if (challengerId === opponentId) {
                    ws.send(JSON.stringify({ type: 'battle_error', message: "You can't challenge yourself!" }));
                    return;
                }

                if (!await canBattle(challengerId)) {
                    ws.send(JSON.stringify({ type: 'battle_error', message: 'You have reached your daily battle limit of 5.' }));
                    return;
                }
                
                const opponent = onlineUsers.get(opponentId);
                const challenger = onlineUsers.get(challengerId);

                if (opponent && opponent.ws.readyState === opponent.ws.OPEN) {
                    console.log(`Forwarding challenge from ${challenger.username} to ${opponent.username}`);
                    opponent.ws.send(JSON.stringify({ 
                        type: 'challenge_received',
                        fromId: challengerId,
                        fromUsername: challenger.username 
                    }));
                }
                break;
            }

            case 'challenge_accepted': {
                const player1Id = data.fromId; 
                const player2Id = data.toId;

                const player1 = onlineUsers.get(player1Id);
                const player2 = onlineUsers.get(player2Id);

                if (!await canBattle(player1Id) || !await canBattle(player2Id)) {
                    const msg = JSON.stringify({ type: 'battle_error', message: `One of the players has reached their daily battle limit.` });
                    if (player1) player1.ws.send(msg);
                    if (player2) player2.ws.send(msg);
                    return;
                }

                if (player1 && player2) {
                    const battleData = await runBattle(player1Id, player2Id);
            
                    if (battleData.error) {
                        const errorMessage = JSON.stringify({ type: 'battle_error', message: battleData.error });
                        player1.ws.send(errorMessage);
                        player2.ws.send(errorMessage);
                        return;
                    }
                    
                    const battleMessage = JSON.stringify({
                        type: 'battle_ready',
                        player1: { id: player1Id, username: player1.username },
                        player2: { id: player2Id, username: player2.username },
                        ...battleData
                    });
            
                    player1.ws.send(battleMessage);
                    player2.ws.send(battleMessage);
                }
                break;
            }

            case 'start_bot_battle': {
                const playerId = userId;

                if (!await canBattle(playerId)) {
                    ws.send(JSON.stringify({ type: 'battle_error', message: 'You have reached your daily battle limit of 5.' }));
                    return;
                }
                
                const battleData = await runBattle(playerId, 'BOT');

                if (battleData.error) {
                    ws.send(JSON.stringify({ type: 'battle_error', message: battleData.error }));
                    return;
                }

                ws.send(JSON.stringify({
                    type: 'battle_ready',
                    player1: { id: playerId, username: username },
                    player2: { id: 'BOT', username: 'Bot' },
                    ...battleData
                }));
                break;
            }
        }
    });

    ws.send(JSON.stringify({ type: 'your_id', userId: userId }));
});

function broadcastOnlineUsers() {
    const users = Array.from(onlineUsers.entries()).map(([id, data]) => ({
        id: id,
        username: data.username
    }));
    const message = JSON.stringify({ type: 'online_users', users });
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(message);
        }
    });
}