import express, { Router } from "express";
import { getGame } from "../controllers/testControllers";

const testRouter: Router = express.Router();

testRouter.get("/game", getGame);

export default testRouter;
