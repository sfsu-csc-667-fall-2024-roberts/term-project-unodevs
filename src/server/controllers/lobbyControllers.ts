import db from "../db/connection";
import { Request, Response } from "express";

const getLobbyUsers = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Safely access `userId` from `req.session.user`
  const userId = req.session?.user?.id;

  if (!userId) {
    res.status(400).send("User is not logged in.");
    return;
  }

  // Grab all the players that are in this game
  try {
    const players = await db.any(
      `SELECT users.username FROM users
       JOIN game_users ON users.id = game_users.users_id
       JOIN games ON games.id = game_users.game_id
       WHERE games.id = $1`,
      [id]
    );

    console.log(JSON.stringify(players));
    res.render("lobby.ejs", {
      gameId: id,
      players: players,
      chatMessages: ["hey what is up bro!?"],
    });
  } catch (error) {
    console.error("Error fetching lobby users:", error);
    res.status(500).send("Internal server error.");
  }
};

export { getLobbyUsers };
