#  Pokémon Battle Arena 

**Gotta code 'em all!**  
This full-stack web application lets you dive into the world of Pokémon like never before:

 Search for your favorite Pokémon  
 Build your dream team of favorites  
 Battle other trainers or test your skills against a wild bot  
 Climb the leaderboard to become the very best!

---

##  Features

-  **User Authentication** – Register, log in, and manage your account securely
-  **Pokémon Search** – Look up Pokémon by name, type, ability, or Pokédex ID
-  **Detailed Stats** – View abilities, types, base stats, height, weight, and more
-  **Favorites List** – Save up to 10 favorite Pokémon and manage them easily
-  **Download Favorites** – Export your dream team as a JSON file
-  **Real-time PvP Battles** – Challenge other trainers with WebSockets
-  **Bot Battles** – Face off against a random wild Pokémon!
-  **Leaderboard** – Track top-performing trainers in epic battles

---

##  File Structure

###  Root Directory
- `.gitignore` – Ignores `node_modules`, `.env`, logs, etc.
- `package.json` – Project metadata and dependencies
- `package-lock.json` – Exact dependency versions
- `server.js` – Main server entry point (Express + WebSocket)
- `tree.txt` – Visual project tree diagram

---

###  `public/` – Client-facing HTML pages
- `index.html` – Main search and homepage
- `register.html` / `login.html` – User authentication pages
- `favorites.html` – Manage your saved Pokémon
- `details.html` – In-depth Pokémon data + YouTube videos
- `arena.html` – Choose your battle mode
- `arena-vs-bot.html` – 1vBot mode
- `arena-vs-player.html` – Real-time PvP using WebSockets
- `arena-leaderboard.html` – Trainer leaderboard

---

###  `src/` – Application Logic

####  `client/` – Frontend Scripts & Styles
- `script.js` – Handles search
- `register.js` / `login.js` – Auth forms
- `auth.js` – Session management
- `favorites.js` – Add/remove/download favorites
- `details.js` – Fetch & render Pokémon data
- `arena-vs-bot.js` – Battle logic vs bot
- `arena-vs-player.js` – WebSocket PvP battle logic
- `arena-leaderboard.js` – Fetch and render leaderboard
- `style.css` – Themed custom styles

#### 🔌 `api/` – Backend Code
- `controllers/`
  - `auth.controller.js` – User sessions & login logic
  - `pokemon.controller.js` – Favorites & YouTube integration
  - `leaderboard.controller.js` – Rankings logic
- `middleware/`
  - `auth.middleware.js` – Route protection
- `routes/`
  - `auth.routes.js`
  - `pokemon.routes.js`
  - `leaderboard.routes.js`

####  `data/` – Persistent Storage
- `users.json` – Registered users
- `favorites/` – Per-user favorite lists (e.g., `1.json`, `2.json`)
- `battles.json` – Match history & results

------

##  Getting Started

1. **Clone the repo**:
   ```bash
   git clone <repository-url>
   cd pokemon-battle-arena
    ```
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env` file** (YouTube API required):

   ```env
   YOUTUBE_API_KEY=your_api_key
   ```

4. **Start the server**:

   ```bash
   npm start
   ```

5. **Visit the app**:

   ```
   http://localhost:3003
   ```

---

##  API Endpoints

###  Auth

* `POST /api/auth/register` – Register
* `POST /api/auth/login` – Login
* `POST /api/auth/logout` – Logout
* `GET /api/auth/status` – Session check

###  Pokémon

* `GET /api/pokemon/favorites` – Get favorites
* `POST /api/pokemon/favorites` – Add favorite
* `DELETE /api/pokemon/favorites/:id` – Remove favorite
* `GET /api/pokemon/videos/:pokemonName` – Related YouTube videos

###  Leaderboard

* `GET /api/leaderboard` – Rankings by win rate

---

##  Technologies Used

###  Frontend

* HTML / CSS / JavaScript
* Bootstrap

### Backend

* Node.js
* Express.js
* WebSocket (`ws`)

###  Authentication

* `bcrypt`
* `express-session`

###  API Integration

* `axios`
* `dotenv`
* YouTube Data API

###  Storage

* JSON-based data store

---

##  Sneak Peek

> *"Battles are better when your Charizard roasts the competition."*
> Stay tuned for future enhancements: animations, evolution chains, and shiny hunts!

---

##  Further Reading

* [Pokémon API Documentation (PokeAPI)](https://pokeapi.co/docs/v2)
* [How WebSockets Work (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
* [Intro to Full-Stack JavaScript (YouTube)](https://www.youtube.com/watch?v=9Pzj7Aj25lw)
* [YouTube Data API (Google Dev)](https://developers.google.com/youtube/v3)

---

