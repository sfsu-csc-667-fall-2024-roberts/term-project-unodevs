import { Request, Response } from 'express';
import db from "../db/connection";

// Types for `playCard`
interface PlayCardRequestBody {
  cardId: string;
  color: string;
  userId: string;
}

interface PlayCardRequestParams {
  id: string;
}

// Types for `getGame`
interface GetGameRequestParams {
  id: string;
}

interface Card {
  color: string;
  symbol: string;
  id: number;
}

interface Player {
  name: string;
  handSize: number;
  id: number;
}

interface GameData {
  clientHand: Card[];
  playerList: Player[];
  discardCard: Card;
  chatMessages: string[];
}

// `playCard` function
const playCard = async (
  req: Request<PlayCardRequestParams, any, PlayCardRequestBody>,
  res: Response
): Promise<void> => {
  console.log("in playcard");
  const { cardId, color, userId } = req.body;
  const gameId = req.params.id;
  console.log(cardId, color, userId, gameId);
};

// `getGame` function
const getGame = async (
  req: Request<GetGameRequestParams>,
  res: Response
): Promise<void> => {
  const gameId = req.params.id;

  if (!gameId) {
    res.status(400).send("Game ID is required.");
    return;
  }

  // Simulate fetching game data
  const gameData: GameData = {
    clientHand: [
      { color: "red", symbol: "draw_two", id: 1 },
      { color: "yellow", symbol: "three", id: 2 },
      { color: "red", symbol: "four", id: 3 },
    ],
    playerList: [
      { name: "Noah", handSize: 4, id: 1 },
      { name: "Bob", handSize: 5, id: 2 },
      { name: "Billy", handSize: 7, id: 3 },
    ],
    discardCard: { color: "red", symbol: "draw_two", id: 0 },
    chatMessages: ["hello"],
  };

  res.render("game.ejs", {
    ...gameData,
    gameId, // Include gameId for use in the template
  });
};


// `joinGame` function
const joinGame = async (req: Request, res: Response): Promise<void> => {
  const gameId = req.body.gameId || req.query.gameId; // Handle both body and query
  const userId = req.session?.user?.id;

  if (!gameId || !userId) {
    res.status(400).json({ message: "Game ID and User ID are required." });
    return;
  }

  try {
    const gameState = await db.one('SELECT * FROM games WHERE id = $1', [gameId]);

    if (gameState.active) {
      res.status(400).json({ message: "Game is already active" });
      return;
    }

    const lobbySize = await db.one('SELECT COUNT(*) AS count FROM game_users WHERE game_id = $1', [gameId]);
    if (parseInt(lobbySize.count, 10) >= gameState.max_players) {
      res.status(400).json({ message: "Game is full already" });
      return;
    }

    const userInGame = await db.oneOrNone('SELECT * FROM game_users WHERE game_id = $1 AND users_id = $2', [gameId, userId]);
    if (userInGame) {
      res.status(400).json({ message: "User is already in game" });
      return;
    }

    await db.none('INSERT INTO game_users (game_id, users_id) VALUES ($1, $2)', [gameId, userId]);

    const playerList = await db.any(
      `SELECT users.username FROM users 
       JOIN game_users ON users.id = game_users.users_id 
       WHERE game_users.game_id = $1`,
      [gameId]
    );

    req.app.get('io').emit('user-joined', {
      message: `${req.session?.user?.username} has joined the game`,
      newPlayerList: playerList,
    });

    res.status(200).json({ message: "User joined game" });
  } catch (err) {
    console.error("Error handling joinGame:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


// Other game-related functions
const getGameLandingPage = async (req: Request, res: Response): Promise<void> => {
  res.render("gameLandingPage.ejs");
};

const createGame = async (req: Request, res: Response): Promise<void> => {
  const newGameId = Math.floor(Math.random() * 1000); // Placeholder logic
  res.redirect(`/game/${newGameId}`);
};

export { playCard, getGame, joinGame, getGameLandingPage, createGame };
