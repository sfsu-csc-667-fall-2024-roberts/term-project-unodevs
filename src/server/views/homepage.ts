//still need to request available games
interface Game {
    id: number;
    name: string;
    max_players: number;
    lobby_size: number;
  }
  
  const games: Game[] = [
    {
      id: 1,
      name: "Test",
      max_players: 4,
      lobby_size: 1,
    },
    {
      id: 2,
      name: "Test again",
      max_players: 4,
      lobby_size: 2,
    },
    {
      id: 3,
      name: "Test again again",
      max_players: 4,
      lobby_size: 3,
    },
  ];
  
  games.forEach((game) => {
    const outerDiv = document.createElement("div");
    outerDiv.classList.add("available-game");
  
    const idParagraph = document.createElement("p");
    idParagraph.innerText = game.id.toString();
  
    const nameParagraph = document.createElement("p");
    nameParagraph.innerText = game.name;
  
    const lobbySizeParagraph = document.createElement("p");
    lobbySizeParagraph.innerText = `Players : ${game.lobby_size}/${game.max_players}`;
  
    const joinButton = document.createElement("button");
    joinButton.addEventListener("click", () => {
      alert(`Joining game, game ${game.name}, id ${game.id}`);
    });
    joinButton.innerText = "Join";
  
    const innerDiv = document.createElement("div");
    innerDiv.classList.add("game-info");
  
    outerDiv.appendChild(idParagraph);
    innerDiv.appendChild(nameParagraph);
    innerDiv.appendChild(lobbySizeParagraph);
    outerDiv.appendChild(innerDiv);
    outerDiv.appendChild(joinButton);
  
    const gameListContainer = document.getElementById("game-list-container");
    if (gameListContainer) {
      gameListContainer.appendChild(outerDiv);
    }
  });
  
  const menuCreateGameButton = document.getElementById("create-game-button");
  menuCreateGameButton?.addEventListener("click", () => {
    const createGameForm = document.getElementById("popup-container");
    if (createGameForm) {
      createGameForm.style.display = "flex";
    }
  });
  
  const closeCreateGameFormButton = document.getElementById("close-popup");
  closeCreateGameFormButton?.addEventListener("click", () => {
    const createGameForm = document.getElementById("popup-container");
    if (createGameForm) {
      createGameForm.style.display = "none";
    }
  });
  
  const formCreateGameButton = document.getElementById("form-create-game");
  formCreateGameButton?.addEventListener("click", (e) => {
    e.preventDefault();
    alert("TODO : fix this form & create the game");
  });
  