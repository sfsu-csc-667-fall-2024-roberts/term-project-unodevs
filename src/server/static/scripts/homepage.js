const gameList = document.getElementById("game-list");
const activeGameList = document.getElementById("active-game-list");

// Fetch all lobbies
const getLobbies = async () => {
  try {
    const res = await fetch(`/lobby/list`);
    const json = await res.json();
    return json; // game { id, name, player_count, max_players, has_password }
  } catch (error) {
    console.log(error);
    return [];
  }
};

// Fetch active games
const getActiveGames = async () => {
  try {
    const result = await fetch(`/game/getMyGames`);
    const json = await result.json();
    return json; // game { id, name }
  } catch (err) {
    console.log("Could not fetch active games: " + err);
    return [];
  }
};

// Display a lobby in the game list
const displayGameInList = (game) => {
  const outerDiv = document.createElement("div");
  outerDiv.classList.add("available-game");
  outerDiv.id = `game-${game.id}`;

  const idParagraph = document.createElement("p");
  idParagraph.innerText = `Game ID: ${game.id}`;

  const nameParagraph = document.createElement("p");
  nameParagraph.innerText = game.name + (game.has_password ? " 🔒" : "");

  const lobbySizeParagraph = document.createElement("p");
  lobbySizeParagraph.innerText = `Players: ${game.player_count}/${game.max_players}`;

  const joinButton = document.createElement("button");
  joinButton.addEventListener("click", async () => {
    if (game.has_password) {
      generateProtectedGameForm(game.id, game.name);
    } else {
      await joinGame(game.id, "");
    }
  });
  joinButton.innerText = "Join";

  const innerDiv = document.createElement("div");
  innerDiv.classList.add("game-info");

  innerDiv.appendChild(nameParagraph);
  innerDiv.appendChild(lobbySizeParagraph);
  outerDiv.appendChild(idParagraph);
  outerDiv.appendChild(innerDiv);
  outerDiv.appendChild(joinButton);

  gameList.appendChild(outerDiv);
};

// Display an active game in the active games list
const displayActiveGameInList = (game) => {
  const outerDiv = document.createElement("div");
  outerDiv.classList.add("available-game");
  outerDiv.id = `active-game-${game.id}`;

  const idParagraph = document.createElement("p");
  idParagraph.innerText = `Game ID: ${game.id}`;

  const nameParagraph = document.createElement("p");
  nameParagraph.innerText = game.name;

  const rejoinButton = document.createElement("button");
  rejoinButton.addEventListener("click", () => {
    window.location.href = `/game/${game.id}`;
  });
  rejoinButton.innerText = "Rejoin";

  outerDiv.appendChild(idParagraph);
  outerDiv.appendChild(nameParagraph);
  outerDiv.appendChild(rejoinButton);

  activeGameList.appendChild(outerDiv);
};

// Join a game
const joinGame = async (gameId, password) => {
  try {
    const res = await fetch(`/game/${gameId}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      console.log(res);
      const errorMessage = document.getElementById("error-message-p");
      errorMessage.innerText = await res.text();
      return;
    }

    if (res.redirected) {
      window.location.href = res.url;
    }
  } catch (error) {
    console.log(error);
  }
};

// Show the protected game form
const generateProtectedGameForm = (id, name) => {
  const title = document.getElementById("protected-game-form-title");
  title.innerText = `Join Game: ${name}`;

  const button = document.getElementById("protected-game-form-button");
  button.onclick = async () => {
    const password = document.getElementById("password").value;
    await joinGame(id, password);
  };

  const formContainer = document.getElementById("protected-game-popup");
  formContainer.style.display = "flex";
};

// Close the protected game form
document
  .getElementById("close-protected-game-form")
  .addEventListener("click", () => {
    const formContainer = document.getElementById("protected-game-popup");
    formContainer.style.display = "none";
  });

// Create a new game
document
  .getElementById("create-game-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("create-game-name").value;
    const password = document.getElementById("create-game-password").value;
    const max_players = document.getElementById(
      "create-game-max-players"
    ).value;

    try {
      const res = await fetch("/game/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, password, max_players }),
      });

      if (res.redirected) {
        window.location.href = res.url;
      } else if (!res.ok) {
        const errorText = await res.text();
        alert(`Error creating game: ${errorText}`);
      }
    } catch (error) {
      console.log(error);
    }
  });

// Open and close the create game form
document.getElementById("create-game-button").addEventListener("click", () => {
  document.getElementById("popup-container").style.display = "flex";
});
document.getElementById("close-popup").addEventListener("click", () => {
  document.getElementById("popup-container").style.display = "none";
});

// Filter the displayed lobbies
const displayFilteredList = () => {
  const hideFull = document.getElementById("list-filter-hide-full").checked;
  const showPublic = document.getElementById("list-filter-public").checked;
  const showPrivate = document.getElementById("list-filter-private").checked;

  games.forEach((game) => {
    const gameContainer = document.getElementById(`game-${game.id}`);

    if (!gameContainer) return;

    if (hideFull && game.player_count === game.max_players) {
      gameContainer.style.display = "none";
    } else if (
      (!showPrivate && game.has_password) ||
      (!showPublic && !game.has_password)
    ) {
      gameContainer.style.display = "none";
    } else {
      gameContainer.style.display = "flex";
    }
  });
};

// Filter buttons logic
document
  .getElementById("list-filter-all")
  .addEventListener("change", (event) => {
    if (event.target.checked) {
      document.getElementById("list-filter-hide-full").checked = false;
      document.getElementById("list-filter-public").checked = true;
      document.getElementById("list-filter-private").checked = true;
      displayFilteredList();
    }
  });

document
  .getElementById("list-filter-hide-full")
  .addEventListener("change", () => {
    displayFilteredList();
  });

document
  .getElementById("list-filter-public")
  .addEventListener("change", () => {
    displayFilteredList();
  });

document
  .getElementById("list-filter-private")
  .addEventListener("change", () => {
    displayFilteredList();
  });

// Refresh the lobby list
document
  .getElementById("list-refresh-button")
  .addEventListener("click", async () => {
    games = await getLobbies();
    gameList.innerHTML = ""; // Empty list body
    games.forEach((game) => displayGameInList(game));
    displayFilteredList();
  });

// Load all lobbies and active games on page load
let games = [];
let activeGames = [];
(async () => {
  games = await getLobbies();
  activeGames = await getActiveGames();

  games.forEach((game) => displayGameInList(game));
  activeGames.forEach((game) => displayActiveGameInList(game));
})();
