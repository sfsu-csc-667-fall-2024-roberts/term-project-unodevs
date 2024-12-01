import express, { Router, Request, Response } from "express";
import { getLobbyUsers } from "../controllers/lobbyControllers";

const lobbyRouter: Router = express.Router();

lobbyRouter.get("/", (req: Request, res: Response): void => {
  res.render("lobbySelection.ejs");
});

lobbyRouter.get("/:id", getLobbyUsers);

export default lobbyRouter;
