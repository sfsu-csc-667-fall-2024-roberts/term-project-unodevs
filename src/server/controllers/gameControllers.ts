import { Request, Response } from "express";
import db from "../db/connection";

interface PlayCardRequestBody {
  cardId: string;
  color: string;
  userId: string;
}

interface PlayCardRequestParams {
  id: string;
}

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

const playCard = async (
  req: Request<PlayCardRequestParams, any, PlayCardRequestBody>,
  res: Response
): Promise<void> => {
  const { cardId, color, userId } = req.body;
  const gameId = req.params.id;

  if (!cardId || !color || !userId || !gameId) {
    res.status(400).json({ message: "All parameters are required." });
    return;
  }

  try {
    await db.none(
      `INSERT INTO played_cards (game_id, card_id, color, user_id) VALUES ($1, $2, $3, $4)`,
      [gameId, cardId, color, userId]
    );
    res.status(200).json({ message: "Card played successfully." });
  } catch (err) {
    console.error("Error processing playCard:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getGame = async (req: Request<GetGameRequestParams>, res: Response): Promise<void> => {
  const gameId = req.params.id;

  if (!gameId) {
    res.status(400).send("Game ID is required.");
    return;
  }

  try {
    const gameRow = await db.oneOrNone(`SELECT * FROM games WHERE id = $1`, [gameId]);

    if (!gameRow) {
      res.status(404).send("Game not found.");
      return;
    }

    const gameData: GameData = {
      clientHand: [
        { color: "red", symbol: "draw_two", id: 1 },
        { color: "yellow", symbol: "three", id: 2 },
        { color: "red", symbol: "four", id: 3 },
      ],
      playerList: [
        { name: "test", handSize: 4, id: 1 },
        { name: "noah", handSize: 5, id: 2 },
        { name: "bob", handSize: 7, id: 3 },
      ],
      discardCard: { color: "red", symbol: "draw_two", id: 0 },
      chatMessages: ["Hey?"],
    };

    res.render("game.ejs", { ...gameData, gameId });
  } catch (err) {
    console.error("Error fetching game:", err);
    res.status(500).send("Internal server error.");
  }
};

const joinGame = async (req: Request, res: Response): Promise<void> => {
  const { password } = req.body;
  const gameId = req.params.id;
  const userId = req.session?.user?.id;

  console.log("Join Game Request:", { gameId, password, userId });

  if (!gameId || !userId) {
      res.status(400).json({ message: "Game ID and User ID are required." });
      return;
  }

  try {
      const game = await db.oneOrNone(
          `SELECT id, password, max_players FROM games WHERE id = $1`,
          [gameId]
      );

      console.log("Game Found:", game);

      if (!game) {
          res.status(404).send("Game not found.");
          return;
      }

      if (game.password && game.password !== password) {
          res.status(403).send("Incorrect password.");
          return;
      }

      const existingPlayer = await db.oneOrNone(
          `SELECT game_id FROM game_users WHERE game_id = $1 AND users_id = $2`,
          [gameId, userId]
      );

      console.log("Existing Player:", existingPlayer);

      if (!existingPlayer) {
          await db.none(
              `INSERT INTO game_users (game_id, users_id) VALUES ($1, $2)`,
              [gameId, userId]
          );
          console.log("User added to game.");
      }

      res.redirect(`/game/${gameId}`);
  } catch (err) {
      console.error("Error joining game:", err);
      res.status(500).send("Internal server error.");
  }
};


const createGame = async (req: Request, res: Response): Promise<void> => {
  const { name, password, max_players } = req.body;

  if (!name) {
    res.status(400).json({ message: "Game Name is required." });
    return;
  }

  try {
    const game = await db.one(
      `INSERT INTO games (name, password, max_players)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [name, password || null, max_players || 4]
    );

    res.redirect(`/game/${game.id}`);
  } catch (err) {
    console.error("Error creating game:", err);
    res.status(500).send("Internal server error.");
  }
};

const getMyGames = async (req: Request, res: Response): Promise<void> => {
  const userId = req.session?.user?.id;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }

  try {
    const games = await db.any(
      `SELECT g.id, g.name
       FROM games g
       JOIN game_users gu ON g.id = gu.game_id
       WHERE gu.users_id = $1`,
      [userId]
    );

    res.status(200).json(games);
  } catch (err) {
    console.error("Error fetching user's games:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

export { playCard, getGame, joinGame, createGame, getMyGames };
