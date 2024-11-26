import { Request, Response } from 'express';

interface Card {
  color: string;
  symbol: string;
  id: number;
}

interface Player {
  name: string;
  handSize: number;
}

interface GameData {
  clientHand: Card[];
  playerList: Player[];
  discardCard: Omit<Card, 'id'>;
  chatMessages: string[];
}

const getGame = async (req: Request, res: Response): Promise<void> => {
  res.render("game.ejs", {
    clientHand: [
      { color: "red", symbol: "draw_two", id: 1 },
      { color: "yellow", symbol: "three", id: 2 },
      { color: "red", symbol: "four", id: 3 },
    ],
    playerList: [
      { name: "Noah", handSize: 4 },
      { name: "Bob", handSize: 5 },
      { name: "Billy", handSize: 7 },
    ],
    discardCard: { color: "red", symbol: "draw_two" },
    chatMessages: ["Test"], 
  } as GameData);
};

export { getGame };
