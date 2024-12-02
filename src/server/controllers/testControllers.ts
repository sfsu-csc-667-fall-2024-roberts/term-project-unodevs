import { Request, Response } from "express";

export const getGame = async (req: Request, res: Response): Promise<void> => {
  res.render("game.ejs", {
    gameId: 1,
    clientHand: [
      { color: "red", symbol: "draw_two", id: 1 },
      { color: "yellow", symbol: "three", id: 2 },
      { color: "red", symbol: "four", id: 3 },
      { color: "wild", symbol: "wild", id: 4 },
    ],
    playerList: [
      { name: "Noah", handSize: 4 },
      { name: "Bob", handSize: 5 },
      { name: "Billy", handSize: 7 },
    ],
    discardCard: { color: "red", symbol: "draw_two" },
    chatMessages: ["Is this working"],
  });
};
