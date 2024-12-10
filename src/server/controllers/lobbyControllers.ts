import db from "../db/connection";
import { Request, Response } from "express";

// Fetch all users in a lobby
const getLobbyUsers = async (req: Request, res: Response): Promise<void> => {
  const { id: gameId } = req.params;
  const userId = req.session?.user?.id;

  if (!userId) {
    res.status(400).send("User is not logged in.");
    return;
  }

  try {
    const players = await db.any(
      `
      SELECT users.username 
      FROM users
      JOIN game_users ON users.id = game_users.users_id
      JOIN games ON games.id = game_users.game_id
      WHERE games.id = $1
      `,
      [gameId]
    );

    console.log(JSON.stringify(players));
    res.render("lobby.ejs", {
      gameId: gameId,
      players: players,
      chatMessages: ["hey what is up bro!?"], // Example messages
    });
  } catch (error) {
    console.error("Error fetching lobby users:", error);
    res.status(500).send("Internal server error.");
  }
};

// Fetch a specific lobby and render it
const getLobby = async (req: Request, res: Response): Promise<void> => {
  const { id: gameId } = req.params;
  const userId = req.session?.user?.id;

  if (!userId) {
    res.status(400).send("User is not logged in.");
    return;
  }

  const getLobbyQuery = `
    SELECT g.id, g.name, g.active
    FROM games g
    LEFT JOIN game_users gu ON g.id = gu.game_id
    WHERE g.id = $1
      AND EXISTS (
        SELECT game_id
        FROM game_users
        WHERE users_id = $2
          AND game_id = $1
      )
  `;

  const playerListQuery = `
    SELECT u.username
    FROM users u
    LEFT JOIN game_users gu ON u.id = gu.users_id
    WHERE gu.game_id = $1
  `;

  try {
    const lobby = await db.oneOrNone(getLobbyQuery, [gameId, userId]);

    // If the user is not part of the lobby, redirect to join page
    if (!lobby) {
      res.render("joinLobby", { id: gameId });
      return;
    }

    // Fetch and render player list
    const players = await db.any(playerListQuery, [gameId]);

    res.render("lobby.ejs", {
      gameName: lobby.name,
      gameId: gameId,
      players: players,
      messages: [], // Optional: Chat messages for the lobby
      loggedIn: !!req.session?.user,
    });
  } catch (error) {
    console.error("Error fetching lobby:", error);
    res.status(500).send("Internal server error.");
  }
};


// Fetch all available lobbies the user can join
const getLobbies = async (req: Request, res: Response): Promise<void> => {
  const userId = req.session?.user?.id;

  if (!userId) {
    res.status(400).send("User is not logged in.");
    return;
  }

  const getLobbiesQuery = `
    SELECT
      g.id, g.name, g.max_players,
      COUNT(gu.users_id) AS player_count,
      CASE
        WHEN g.password IS NOT NULL AND g.password != '' THEN true
        ELSE false
      END AS has_password
    FROM games g
    LEFT JOIN game_users gu ON g.id = gu.game_id
    GROUP BY g.id, g.name, g.max_players
    ORDER BY g.id ASC
  `;

  try {
    const lobbies = await db.any(getLobbiesQuery);
    res.render("gameLandingPage.ejs", {
      lobbies, // Pass the lobbies variable to the EJS template
      loggedIn: !!userId,
    });
  } catch (error) {
    console.error("Error fetching lobbies:", error);
    res.status(500).send("Internal server error.");
  }
};


// Export the functions
export { getLobbyUsers, getLobby, getLobbies };
