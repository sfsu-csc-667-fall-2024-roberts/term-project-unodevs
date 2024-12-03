import express from "express";
import { getLobbyUsers, getLobbies, getLobby } from "../controllers/lobbyControllers";

const lobbyRouter = express.Router();

// Default route to show the lobby landing page
lobbyRouter.get("/", getLobbies);

// Route to list all available lobbies
lobbyRouter.get("/list", getLobbies); // Ensure this uses `getLobbies`

// Route to get all users in a specific lobby
lobbyRouter.get("/:id/users", getLobbyUsers);

// Route to fetch details of a specific lobby
lobbyRouter.get("/:id", getLobby);

export default lobbyRouter;
