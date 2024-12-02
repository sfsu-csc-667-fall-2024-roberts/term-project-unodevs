import express from "express";
import {
  getLobbyUsers,
  getLobbies,
  getLobby,
} from "../controllers/lobbyControllers";

const lobbyRouter = express.Router();

// Route to get all users in a specific lobby
lobbyRouter.get("/:id/users", getLobbyUsers);

// Route to list all available lobbies
lobbyRouter.get("/list", getLobbies);

// Route to fetch details of a specific lobby
lobbyRouter.get("/:id", getLobby);

export default lobbyRouter;