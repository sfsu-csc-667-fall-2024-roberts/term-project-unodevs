import express from "express";
import { getLobbies } from "../controllers/lobbyControllers";


import {
  playCard,
  getGame,
  createGame,
  joinGame,
  getMyGames,
  startGame,
  drawCard,
} from "../controllers/gameControllers";

const gameRouter = express.Router();

// Redirect `/game` to the landing page
//commented out for debugging
/*
gameRouter.get("/", (req, res) => {
  const loggedIn = !!req.session?.user;
  res.render("gameLandingPage", { loggedIn });
});
*/

// Route to play a card in a game
gameRouter.post("/:id/card/play", playCard);

// Route to create a new game
gameRouter.post("/create", createGame);

// Route to join an existing game
gameRouter.post("/:id/join", joinGame);

// Route to get the games of the current user
gameRouter.get("/mine", getMyGames);

// Route to fetch details of a specific game
gameRouter.get("/:id", getGame);

gameRouter.post("/startGame", startGame);

gameRouter.post("/:id/card/draw", drawCard);

gameRouter.get("/", getLobbies); // Use `getLobbies` to render `gameLandingPage.ejs`





export default gameRouter;
