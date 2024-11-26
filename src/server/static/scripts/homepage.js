var games = [
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
games.forEach(function (game) {
    var outerDiv = document.createElement("div");
    outerDiv.classList.add("available-game");
    var idParagraph = document.createElement("p");
    idParagraph.innerText = game.id.toString();
    var nameParagraph = document.createElement("p");
    nameParagraph.innerText = game.name;
    var lobbySizeParagraph = document.createElement("p");
    lobbySizeParagraph.innerText = "Players : ".concat(game.lobby_size, "/").concat(game.max_players);
    var joinButton = document.createElement("button");
    joinButton.addEventListener("click", function () {
        alert("Joining game, game ".concat(game.name, ", id ").concat(game.id));
    });
    joinButton.innerText = "Join";
    var innerDiv = document.createElement("div");
    innerDiv.classList.add("game-info");
    outerDiv.appendChild(idParagraph);
    innerDiv.appendChild(nameParagraph);
    innerDiv.appendChild(lobbySizeParagraph);
    outerDiv.appendChild(innerDiv);
    outerDiv.appendChild(joinButton);
    var gameListContainer = document.getElementById("game-list-container");
    if (gameListContainer) {
        gameListContainer.appendChild(outerDiv);
    }
});
// Verify "Create Game" button text
var menuCreateGameButton = document.getElementById("create-game-button");

// Ensure button displays correct text
if (menuCreateGameButton) {
    menuCreateGameButton.innerText = "Create a game";
}

menuCreateGameButton?.addEventListener("click", function () {
    var createGameForm = document.getElementById("popup-container");
    if (createGameForm) {
        createGameForm.style.display = "flex";
    }
});

var closeCreateGameFormButton = document.getElementById("close-popup");
closeCreateGameFormButton?.addEventListener("click", function () {
    var createGameForm = document.getElementById("popup-container");
    if (createGameForm) {
        createGameForm.style.display = "none";
    }
});

var formCreateGameButton = document.getElementById("form-create-game");
formCreateGameButton?.addEventListener("click", function (e) {
    e.preventDefault();
    alert("For testing purposes, still need to add function for creating games");
});
