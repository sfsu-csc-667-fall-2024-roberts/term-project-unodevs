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

interface StartGameRequestBody {
  gameId: string;
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

    // Ensure `gameName` is included in the rendered data
    res.render("game.ejs", {
      gameName: gameRow.name, // Use the `name` field from the gameRow object
      ...gameData,
      gameId,
    });
  } catch (err) {
    console.error("Error fetching game:", err);
    res.status(500).send("Internal server error.");
  }
};


const joinGame = async (req: Request, res: Response): Promise<void> => {
  const { password } = req.body;
  const gameId = req.params.id;
  const userId = req.session?.user?.id;

  if (!gameId || !userId) {
    res.status(400).json({ message: "Game ID and User ID are required." });
    return;
  }

  try {
    const game = await db.oneOrNone(
      `SELECT id, password, max_players FROM games WHERE id = $1`,
      [gameId]
    );

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

    if (!existingPlayer) {
      await db.none(
        `INSERT INTO game_users (game_id, users_id) VALUES ($1, $2)`,
        [gameId, userId]
      );
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

const startGame = async (req: Request<any, any, StartGameRequestBody>, res: Response): Promise<void> => {
  const { gameId } = req.body;

  if (!gameId) {
    res.status(400).json({ message: "Game ID is required to start the game." });
    return;
  }

  try {
    await db.none(`CALL start_game($1)`, [gameId]);
    req.app.get("io").to(gameId).emit("game-start", { gameId });
    res.status(200).json({ message: "Game started successfully." });
  } catch (err) {
    console.error("Error starting game:", err);
    res.status(500).send("Internal server error.");
  }
};

const updateActiveSeat = async (userId: string, gameId: string): Promise<void> => {
  const getTotalSeats = `SELECT COUNT(*) FROM game_users WHERE game_id = $1`;
  const getCurrentSeatAndDirection = `SELECT game_users.seat, games.direction
    FROM game_users
    JOIN games ON game_users.game_id = games.id
    WHERE game_users.game_id = $1 AND game_users.users_id = $2`;
  const updateCurrentPlayer = `UPDATE games SET current_player_id = (SELECT users_id FROM game_users WHERE seat = $1 AND game_id = $2) WHERE id = $2`;

  const totalSeats = Number((await db.one(getTotalSeats, [gameId])).count);
  const currentSeatAndDirection = await db.one(getCurrentSeatAndDirection, [gameId, userId]);

  const addend = currentSeatAndDirection.direction === "clockwise" ? 1 : -1;
  let newSeat = currentSeatAndDirection.seat + addend;

  if (newSeat < 1) {
    newSeat += totalSeats;
  } else if (newSeat > totalSeats) {
    newSeat -= totalSeats;
  }

  await db.none(updateCurrentPlayer, [newSeat, gameId]);
};

const drawCards = async (currentPlayerId: string, gameId: string, drawNumber: number): Promise<void> => {
  const getDeckCountQuery = `SELECT COUNT(*) FROM game_cards WHERE game_id = $1 AND user_id IS NULL`;

  const deckCount = await db.oneOrNone(getDeckCountQuery, [gameId]);
  if (!deckCount || Number(deckCount.count) < drawNumber) {
    const getDiscardCountQuery = `SELECT COUNT(*) FROM game_cards WHERE game_id = $1 AND discarded = true`;
    const discardCount = await db.oneOrNone(getDiscardCountQuery, [gameId]);
    if (!discardCount || discardCount.count < drawNumber) {
      console.log("No more cards in discard pile or deck, ending game");
      return;
    } else {
      const restoreDeckQuery = `UPDATE game_cards SET user_id = NULL, discarded = false WHERE discarded = true AND game_id = $1`;
      await db.none(restoreDeckQuery, [gameId]);
    }
  }

  const drawCardsQuery = `UPDATE game_cards SET user_id = $1 
    WHERE game_id = $2 
    AND card_id IN (SELECT card_id FROM game_cards WHERE user_id IS NULL ORDER BY RANDOM() LIMIT $3)`;

  await db.none(drawCardsQuery, [currentPlayerId, gameId, drawNumber]);
};

const reverseDirection = async (gameId: string): Promise<void> => {
  const gameDirectionQuery = `UPDATE games
    SET direction = (
      CASE
          WHEN (SELECT direction FROM games WHERE id = $1) = 'clockwise'::directions THEN 'counterclockwise'::directions
          ELSE 'clockwise'::directions
      END
    )
    WHERE id = $1`;

  await db.none(gameDirectionQuery, [gameId]);
};

const isValidMove = async (color: string, symbol: string, gameId: string): Promise<boolean> => {
  if (symbol === "wild" || symbol === "wild_draw_four") {
    return true;
  }

  const activeCardAndColorQuery = `SELECT c.symbol, g.active_color 
     FROM games g 
     JOIN cards c ON g.current_card_id = c.id 
     WHERE g.id = $1`;

  const symbolAndColor = await db.one(activeCardAndColorQuery, [gameId]);
  return symbolAndColor.active_color === color || symbolAndColor.symbol === symbol;
};

const isOutOfTurn = async (gameId: string, userId: string): Promise<boolean> => {
  const getActivePlayerQuery = `SELECT current_player_id FROM games WHERE id = $1`;
  const activeId = await db.one(getActivePlayerQuery, [gameId]);
  return activeId.current_player_id !== userId;
};

const drawCard = async (req: Request, res: Response): Promise<void> => {
  const userId = req.session?.user?.id;
  const gameId = req.params.id;

  if (!userId || !gameId) {
    res.status(400).json({ message: "User ID and Game ID are required." });
    return;
  }

  if (await isOutOfTurn(gameId, userId)) {
    res.status(400).send("It's not your turn.");
    return;
  }

  try {
    await drawCards(userId, gameId, 1);
    await updateActiveSeat(userId, gameId);
    res.status(200).send("Card drawn and seat updated.");
  } catch (err) {
    console.error("Error during drawCard:", err);
    res.status(500).send("Internal server error.");
  }
};



export { playCard, getGame, joinGame, createGame, getMyGames,
startGame, updateActiveSeat, drawCards, reverseDirection, 
isValidMove, isOutOfTurn, drawCard, };
