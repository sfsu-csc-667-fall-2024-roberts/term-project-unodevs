import { Request, Response } from 'express';

interface PlayCardRequestBody {
  cardId: string;
  color: string;
  userId: string;
}

interface PlayCardRequestParams {
  id: string;
}

const playCard = async (
  req: Request<PlayCardRequestParams, any, PlayCardRequestBody>,
  res: Response
): Promise<void> => {
  console.log("in playcard");
  const { cardId, color, userId } = req.body;
  const gameId = req.params.id;
  console.log(cardId, color, userId, gameId);
};

// Returns the initial game state
interface GetGameRequestParams {
  id: string;
}

interface Card {
  color: string;
  symbol: string;
  id: number;
}

interface Player {
  name: string;
  handSize: number;
  id: number;
}

interface GameData {
  clientHand: Card[];
  playerList: Player[];
  discardCard: Card;
  chatMessages: string[];
}

const getGameLandingPage = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    // Render the landing page template
    res.render("gameLandingPage.ejs");
  };

  // Function to handle creating a new game
const createGame = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    // Logic to create a new game and generate an ID
    const newGameId = Math.floor(Math.random() * 1000); // Placeholder logic
    // Redirect to the new game page
    res.redirect(`/game/${newGameId}`);
  };
  
  // Function to handle joining an existing game
  const joinGame = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const gameId = req.query.gameId;
    if (gameId) {
      res.redirect(`/game/${gameId}`);
    } else {
      res.status(400).send("Game ID is required to join a game.");
    }
  };

const getGame = async (
  req: Request<GetGameRequestParams>,
  res: Response
): Promise<void> => {
  const gameId = req.params.id;
  // need to db to get the game row by gameID
  if (!gameId) {
    res.status(400).send("Game ID is required.");
    return;
  }

  const gameExists = true;

  if (!gameExists) {
    res.status(404).send("Game not found.");
    return;
  }
  // The object is an example of what the game row from the query should contain.
  // Maybe need to use socket.io to send the correct hand to each player?
  const gameData: GameData = {
    clientHand: [
      { color: "red", symbol: "draw_two", id: 1 },
      { color: "yellow", symbol: "three", id: 2 },
      { color: "red", symbol: "four", id: 3 },
    ],
    playerList: [
      { name: "Noah", handSize: 4, id: 1 },
      { name: "Bob", handSize: 5, id: 2 },
      { name: "Billy", handSize: 7, id: 3 },
    ],
    discardCard: { color: "red", symbol: "draw_two", id: 0 },
    chatMessages: ["hello"], // This message should display all player names in the game.
  };


  

  res.render("game.ejs", gameData);
};

export { playCard, getGame, getGameLandingPage, createGame, joinGame };
