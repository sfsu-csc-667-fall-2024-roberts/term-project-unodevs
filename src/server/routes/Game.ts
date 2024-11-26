import express, { Request, Response, Router } from "express";
import { playCard, getGame, getGameLandingPage, createGame, joinGame } from "../controllers/gameControllers";

const gameRouter: Router = express.Router();
// Route for the landing page
gameRouter.get("/", getGameLandingPage);

// Route to handle creating a new game
gameRouter.post("/create", createGame);

// Route to handle joining a game
gameRouter.get("/join", joinGame);

// Route for playing a card in a specific game
gameRouter.post("/:id/card/play", playCard);

// Route for getting a specific game
gameRouter.get("/:id", getGame);

export default gameRouter;
