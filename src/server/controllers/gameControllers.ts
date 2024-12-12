import { Request, Response } from "express";
import db from "../db/connection";

// Define interfaces for database query results
interface CurrentSeatAndDirection {
  seat: number;
  direction: string;
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
  gameId: string;
  gameName: string;
  clientId: string;
  activePlayerId: string;
  clientHand: Card[];
  playerList: Player[];
  discardCard: Card;
  chatMessages: string[];
}

interface PlayCardRequestBody {
  cardId: string;
  color: string;
  symbol: string;
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

// Update the active seat to the next player
const updateActiveSeat = async (userId: string, gameId: string): Promise<string> => {
  const getTotalSeatsQuery = `SELECT COUNT(*) FROM game_users WHERE game_id = $1`;
  const getCurrentSeatAndDirectionQuery = `
    SELECT game_users.seat, games.direction
    FROM game_users
    JOIN games ON game_users.game_id = games.id
    WHERE game_users.game_id = $1 AND game_users.users_id = $2
  `;
  const updateCurrentPlayerQuery = `
    UPDATE games
    SET current_player_id = (
      SELECT users_id FROM game_users WHERE seat = $1 AND game_id = $2
    )
    WHERE id = $2
    RETURNING current_player_id
  `;

  const totalSeatsResult = await db.one<{ count: string }>(getTotalSeatsQuery, [gameId]);
  const totalSeats = Number(totalSeatsResult.count);

  const currentSeatAndDirection = await db.oneOrNone<CurrentSeatAndDirection>(
    getCurrentSeatAndDirectionQuery,
    [gameId, userId]
  );

  if (!currentSeatAndDirection) {
    throw new Error("User seat not found. Ensure all players are assigned seats.");
  }

  const addend = currentSeatAndDirection.direction === "clockwise" ? 1 : -1;
  let newSeat = currentSeatAndDirection.seat + addend;

  if (newSeat < 1) {
    newSeat += totalSeats;
  } else if (newSeat > totalSeats) {
    newSeat -= totalSeats;
  }

  const result = await db.one<{ current_player_id: string }>(
    updateCurrentPlayerQuery,
    [newSeat, gameId]
  );

  return result.current_player_id;
};


// Draw cards for a player
const drawCards = async (
  currentPlayerId: string,
  gameId: string,
  drawNumber: number
): Promise<Card[]> => {
  const getDeckCountQuery = `SELECT COUNT(*) FROM game_cards WHERE game_id = $1 AND user_id IS NULL`;
  const deckCountResult = await db.oneOrNone<{ count: string }>(getDeckCountQuery, [gameId]);

  if (!deckCountResult || Number(deckCountResult.count) < drawNumber) {
    const getDiscardCountQuery = `SELECT COUNT(*) FROM game_cards WHERE game_id = $1 AND discarded = true`;
    const discardCountResult = await db.oneOrNone<{ count: string }>(getDiscardCountQuery, [
      gameId,
    ]);

    if (!discardCountResult || Number(discardCountResult.count) < drawNumber) {
      console.error("No more cards in discard pile or deck, ending game"); // TODO: Handle this case appropriately
      return [];
    } else {
      const restoreDeckQuery = `
        UPDATE game_cards
        SET user_id = NULL, discarded = false
        WHERE discarded = true AND game_id = $1
      `;
      await db.none(restoreDeckQuery, [gameId]);
    }
  }

  const selectIdsQuery = `
    SELECT card_id FROM game_cards
    WHERE user_id IS NULL AND game_id = $1
    ORDER BY RANDOM()
    LIMIT $2
  `;
  const ids = await db.any<{ card_id: number }>(selectIdsQuery, [gameId, drawNumber]);
  const cardIds = ids.map((id) => id.card_id);

  const drawCardsQuery = `
    UPDATE game_cards
    SET user_id = $1
    WHERE game_id = $2 AND card_id IN ($3:csv)
  `;
  await db.none(drawCardsQuery, [currentPlayerId, gameId, cardIds]);

  const getDrawnCardsQuery = `SELECT * FROM cards WHERE id IN ($1:csv)`;
  const drawnCardsData = await db.any<Card>(getDrawnCardsQuery, [cardIds]);

  return drawnCardsData;
};

// Reverse the direction of play
const reverseDirection = async (gameId: string): Promise<void> => {
  const gameDirectionQuery = `
    UPDATE games
    SET direction = (
      CASE
        WHEN (SELECT direction FROM games WHERE id = $1) = 'clockwise'::directions THEN 'counterclockwise'::directions
        ELSE 'clockwise'::directions
      END
    )
    WHERE id = $1
  `;
  await db.none(gameDirectionQuery, [gameId]);
};

// Check if a move is valid
const isValidMove = async (color: string, symbol: string, gameId: string): Promise<boolean> => {
  if (symbol === "wild" || symbol === "wild_draw_four") {
    return true;
  }

  const activeCardAndColorQuery = `
    SELECT c.symbol, g.active_color
    FROM games g
    JOIN cards c ON g.current_card_id = c.id
    WHERE g.id = $1
  `;
  const symbolAndColor = await db.one<{ symbol: string; active_color: string }>(
    activeCardAndColorQuery,
    [gameId]
  );

  return symbolAndColor.active_color === color || symbolAndColor.symbol === symbol;
};

// Check if it's the user's turn
const isOutOfTurn = async (gameId: string, userId: string): Promise<boolean> => {
  const getActivePlayerQuery = `SELECT current_player_id FROM games WHERE id = $1`;
  const activeId = await db.one<{ current_player_id: string }>(getActivePlayerQuery, [gameId]);
  return activeId.current_player_id !== userId;
};

// Check if the player has won
const isWin = async (gameId: string, userId: string): Promise<boolean> => {
  const getHandCount = `
    SELECT COUNT(card_id) AS count
    FROM game_cards
    WHERE game_id = $1 AND user_id = $2 AND discarded = false
  `;
  const handCount = await db.one<{ count: string }>(getHandCount, [gameId, userId]);
  return handCount.count === "0";
};

// Handle the draw card action
const drawCard = async (req: Request, res: Response): Promise<void> => {
  const userId = req.session?.user?.id;
  const gameId = req.params.id;

  if (!userId || !gameId) {
    res.status(400).json({ message: "User ID and Game ID are required." });
    return;
  }

  if (await isOutOfTurn(gameId, userId)) {
    console.error("Player is trying to move out of turn");
    res.status(400).send("It's not your turn.");
    return;
  }

  let drawnCard: Card[];

  try {
    drawnCard = await drawCards(userId, gameId, 1);
  } catch (error) {
    console.error("Error in drawing card", error);
    res.status(500).send("Error in drawing card");
    return;
  }

  let activePlayerId: string;

  try {
    activePlayerId = await updateActiveSeat(userId, gameId);

    req.app
      .get("io")
      .to(gameId)
      .emit("card-drawn", {
        gameId: gameId,
        clientId: userId,
        activePlayerId: activePlayerId,
        drawnSymbol: drawnCard[0].symbol,
        drawnColor: drawnCard[0].color,
        drawnId: drawnCard[0].id,
      });
    res.status(200).send();
  } catch (error) {
    console.error("Error in updating active seat", error);
    res.status(500).send("Error in updating active seat");
  }
};

// Handle the play card action
const playCard = async (
  req: Request<PlayCardRequestParams, any, PlayCardRequestBody>,
  res: Response
): Promise<void> => {
  const { cardId, color, symbol } = req.body;
  const userId = req.session?.user?.id;
  const gameId = req.params.id;

  if (!cardId || !color || !symbol || !userId || !gameId) {
    res.status(400).json({ message: "All parameters are required." });
    return;
  }

  if (await isOutOfTurn(gameId, userId)) {
    console.error("Player is trying to move out of turn");
    res.status(400).send("It's not your turn.");
    return;
  }

  try {
    const isValid = await isValidMove(color, symbol, gameId);
    if (!isValid) {
      res.status(400).send("Player move not valid");
      return;
    }
  } catch (error) {
    console.error("Could not determine if valid move", error);
    res.status(500).send("Could not determine if valid move");
    return;
  }

  const playCardQuery = `
    UPDATE games SET current_card_id = $1, active_color = $2 WHERE id = $3
  `;
  const updatePlayerHandQuery = `
    UPDATE game_cards
    SET discarded = true
    WHERE game_id = $1 AND card_id = $2 AND user_id = $3
    RETURNING card_id
  `;

  try {
    const card = await db.oneOrNone<{ card_id: number }>(updatePlayerHandQuery, [
      gameId,
      cardId,
      userId,
    ]);

    if (!card) {
      res.status(400).send("Don't cheat :/");
      return;
    }

    if (card.card_id !== Number(cardId)) {
      res.status(500).send("Something went terribly wrong ;(");
      return;
    }
  } catch (error) {
    console.error("Could not update player hand", error);
    res.status(500).send("Could not update player hand");
    return;
  }

  try {
    await db.none(playCardQuery, [cardId, color, gameId]);
  } catch (error) {
    console.error("Could not update active card", error);
    res.status(500).send("Could not update active card");
    return;
  }

  if (symbol === "reverse") {
    try {
      await reverseDirection(gameId);
    } catch (error) {
      console.error("Error reversing direction", error);
      res.status(500).send("Error reversing direction");
      return;
    }
  }

  let activePlayerId: string;
  try {
    activePlayerId = await updateActiveSeat(userId, gameId);
  } catch (error) {
    console.error("Error in updating active seat", error);
    res.status(500).send("Error in updating active seat");
    return;
  }

  let cards: Card[] = [];
  switch (symbol) {
    case "draw_two":
      try {
        const getCurrentPlayerQuery = `SELECT current_player_id FROM games WHERE id = $1`;
        const currentPlayer = await db.one<{ current_player_id: string }>(getCurrentPlayerQuery, [
          gameId,
        ]);
        cards = await drawCards(currentPlayer.current_player_id, gameId, 2);
        req.app.get("io").to(gameId).emit("cards-drawn", {
          gameId: gameId,
          cards,
          currentPlayerId: currentPlayer.current_player_id,
        });
      } catch (error) {
        console.error("Error updating game_cards", error);
        res.status(500).send("Error updating game_cards");
        return;
      }
      break;
    case "wild_draw_four":
      try {
        const getCurrentPlayerQuery = `SELECT current_player_id FROM games WHERE id = $1`;
        const currentPlayer = await db.one<{ current_player_id: string }>(getCurrentPlayerQuery, [
          gameId,
        ]);
        cards = await drawCards(currentPlayer.current_player_id, gameId, 4);
        req.app.get("io").to(gameId).emit("cards-drawn", {
          gameId: gameId,
          cards,
          currentPlayerId: currentPlayer.current_player_id,
        });
      } catch (error) {
        console.error("Error updating game_cards", error);
        res.status(500).send("Error updating game_cards");
        return;
      }
      break;
    case "skip":
      try {
        const getCurrentPlayerQuery = `SELECT current_player_id FROM games WHERE id = $1`;
        const nextPlayer = await db.one<{ current_player_id: string }>(getCurrentPlayerQuery, [
          gameId,
        ]);
        activePlayerId = await updateActiveSeat(nextPlayer.current_player_id, gameId);
      } catch (error) {
        console.error("Could not get total seats or current seat and direction", error);
        res.status(500).send("Could not get total seats or current seat and direction");
        return;
      }
      break;
    default:
      break;
  }

  req.app.get("io").to(gameId).emit("card-played", {
    gameId: gameId,
    color: color,
    symbol: symbol,
    clientId: userId,
    cardId: cardId,
    activePlayerId: activePlayerId,
  });

  try {
    if (await isWin(gameId, userId)) {
      req.app.get("io").to(gameId).emit("is-win", { winnerName: req.session?.user?.username });
      res.status(200).send("Success!");
      return;
    }
  } catch (err) {
    console.error("Error checking win condition", err);
    res.status(500).send("Could not check win condition");
    return;
  }

  res.status(200).send("Card played successfully.");
};

// Get the initial game state
const getGame = async (req: Request, res: Response): Promise<void> => {
  const gameId = parseInt(req.params.id); // Ensures gameId is an integer
  const userId = req.session?.user?.id;

  if (isNaN(gameId)) {
    res.status(400).send("Invalid game ID.");
    return;
  }

  if (!userId) {
    res.status(401).send("Unauthorized. Please log in.");
    return;
  }

  try {
    // Fetch game details
    const game = await db.oneOrNone(`SELECT * FROM games WHERE id = $1`, [gameId]);

    if (!game) {
      res.status(404).send("Game not found.");
      return;
    }

    // Fetch the current player's hand
    const clientHand = await db.any<Card>(
      `
      SELECT c.id, c.color, c.symbol
      FROM cards c
      JOIN game_cards gc ON c.id = gc.card_id
      WHERE gc.game_id = $1 AND gc.user_id = $2 AND gc.discarded = false
      `,
      [gameId, userId]
    );

    // Fetch player list and their hand sizes
    const playerList = await db.any<Player>(
      `
      SELECT u.id, u.username AS name, COUNT(gc.card_id) AS handSize
      FROM users u
      JOIN game_cards gc ON u.id = gc.user_id
      WHERE gc.game_id = $1 AND gc.discarded = false
      GROUP BY u.id, u.username
      ORDER BY u.id
      `,
      [gameId]
    );

    // Fetch the current discard card
    const discardCard = game.current_card_id
      ? await db.one<Card>(
          `SELECT id, color, symbol FROM cards WHERE id = $1`,
          [game.current_card_id]
        )
      : {
          id: 0,
          color: "wild",
          symbol: "wild",
        };

    // Add the active color to the discard card
    discardCard.color = game.active_color;

    // Construct game data
    const gameData: GameData = {
      gameId: gameId.toString(),
      gameName: game.name,
      clientId: userId.toString(),
      activePlayerId: game.current_player_id,
      clientHand: clientHand,
      playerList: playerList,
      discardCard: discardCard,
      chatMessages: ["Welcome to the game!"],
    };

    // Render the game page
    res.render("game.ejs", gameData);
  } catch (error) {
    console.error("Error fetching game:", error);
    res.status(500).send("Internal server error.");
  }
};


// Handle joining a game
const joinGame = async (req: Request, res: Response): Promise<void> => {
  const { password } = req.body;
  const { id: gameId } = req.params;
  const userId = req.session?.user?.id;

  if (!gameId || !userId) {
    res.status(400).json({ message: "Game ID and User ID are required." });
    return;
  }

  try {
    const game = await db.oneOrNone(
      `SELECT id, password FROM games WHERE id = $1`,
      [gameId]
    );

    if (!game) {
      res.status(404).json({ message: "Game not found." });
      return;
    }

    // If password-protected, verify password
    if (game.password && game.password !== password) {
      res.status(403).json({ message: "Incorrect password." });
      return;
    }

    // Check if the user is already in the game
    const userInGame = await db.oneOrNone(
      `SELECT seat FROM game_users WHERE game_id = $1 AND users_id = $2`,
      [gameId, userId]
    );

    if (!userInGame) {
      // Determine next available seat
      const { next_seat } = await db.one<{ next_seat: number }>(
        `SELECT COALESCE(MAX(seat), 0) + 1 AS next_seat FROM game_users WHERE game_id = $1`,
        [gameId]
      );

      await db.none(
        `INSERT INTO game_users (game_id, users_id, seat) VALUES ($1, $2, $3)`,
        [gameId, userId, next_seat]
      );
    }

    // After successful join, redirect to the lobby
    res.redirect(`/lobby/${gameId}`);
  } catch (err) {
    console.error("Error joining game:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};


// Handle creating a new game
const createGame = async (req: Request, res: Response): Promise<void> => {
  const { name, password, max_players } = req.body;
  const userId = req.session?.user?.id;

  if (!name || !userId) {
    res.status(400).json({ message: "Game Name and User ID are required." });
    return;
  }

  const createLobbyQuery = `
    INSERT INTO games (name, password, max_players, current_player_id)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `;

  try {
    const lobby = await db.one<{ id: string }>(createLobbyQuery, [
      name,
      password || null,
      max_players || 4,
      userId,
    ]);
    const gameId = lobby.id;

    const assignSeatQuery = `
      INSERT INTO game_users (users_id, game_id, seat)
      VALUES ($1, $2, $3)
    `;
    await db.none(assignSeatQuery, [userId, gameId, 1]);

    const populateGameCardsQuery = `
      INSERT INTO game_cards (card_id, game_id)
      SELECT id, $1 FROM cards
    `;
    await db.none(populateGameCardsQuery, [gameId]);

    const initialCard = await db.one<Card>(`
      SELECT id, color, symbol
      FROM cards
      WHERE id IN (
        SELECT card_id
        FROM game_cards
        WHERE game_id = $1 AND user_id IS NULL
      )
      ORDER BY RANDOM()
      LIMIT 1
    `, [gameId]);

    await db.none(
      `UPDATE games SET current_card_id = $1, active_color = $2 WHERE id = $3`,
      [initialCard.id, initialCard.color, gameId]
    );

    res.redirect(`/lobby/${gameId}`);
  } catch (err) {
    console.error("Error creating game:", err);
    res.status(500).send("Internal server error.");
  }
};


// Get the games that the user is part of
const getMyGames = async (req: Request, res: Response): Promise<void> => {
  const userId = req.session?.user?.id;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }

  const getMyGamesQuery = `
    SELECT g.id, g.name
    FROM games g
    LEFT JOIN game_users gu ON g.id = gu.game_id
    WHERE g.active = true AND gu.users_id = $1
    ORDER BY g.id
  `;

  try {
    const games = await db.any(getMyGamesQuery, [userId]);
    res.status(200).json(games);
  } catch (err) {
    console.error("Error fetching user's games:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Start a game
const startGame = async (req: Request, res: Response): Promise<void> => {
  const { gameId } = req.body;

  if (!gameId) {
    res.status(400).send("Game ID is required.");
    return;
  }

  try {
    // Check if game is already active
    const { active } = await db.one<{ active: boolean }>(
      `SELECT active FROM games WHERE id = $1`,
      [gameId]
    );
    if (active) {
       res.status(400).send("Game is already active. Cannot deal cards again.");
       return;
    }

    // Mark the game as active
    await db.none("UPDATE games SET active = TRUE WHERE id = $1", [gameId]);

    // Deal initial cards (7 cards each) to every player
    const players = await db.any<{ users_id: number }>(
      `SELECT users_id FROM game_users WHERE game_id = $1 ORDER BY seat`,
      [gameId]
    );

    for (const player of players) {
      await db.none(
        `
        WITH random_cards AS (
          SELECT card_id
          FROM game_cards
          WHERE game_id = $1
            AND user_id IS NULL
          ORDER BY RANDOM()
          LIMIT 7
        )
        UPDATE game_cards
        SET user_id = $2
        WHERE card_id IN (SELECT card_id FROM random_cards)
        `,
        [gameId, player.users_id]
      );
    }

    // Emit "game-start" event
    req.app.get("io").to(gameId.toString()).emit("game-start", { gameId });
    res.status(200).json({ message: "Game started successfully." });
  } catch (err) {
    console.error("Error starting game:", err);
    res.status(500).send("Internal server error.");
  }
};



const abandonGame = async (req: Request, res: Response): Promise<void> => {
  const { id: gameId } = req.params;
  const userId = req.session?.user?.id;

  if (!userId) {
    res.status(401).send("User not authenticated.");
    return;
  }

  try {
    console.log(`User ${userId} left the game ${gameId}.`);
    res.status(200).send("Game left successfully."); 
  } catch (error) {
    console.error("Error leaving game:", error);
    res.status(500).send("Internal server error.");
  }
};


export {
  playCard,
  getGame,
  joinGame,
  drawCard,
  createGame,
  getMyGames,
  startGame,
  updateActiveSeat,
  drawCards,
  reverseDirection,
  isValidMove,
  isOutOfTurn,
  abandonGame,
};
