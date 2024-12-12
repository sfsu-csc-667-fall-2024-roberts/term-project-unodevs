import { io } from "https://cdn.skypack.dev/socket.io-client";

let selectedId;
let selectedCardId;
const gameId = Number(document.getElementById("game-id").value);
const clientId = Number(document.getElementById("client-id").value);
const activePlayerIdInput = document.getElementById("active-player-id");

// Determine legality of move
const isLegalMove = (card) => {
  if (card.color === "wild") return true;
  const discardCard = document.getElementById("discard-card");
  const color = discardCard.getAttribute("card-color");
  const symbol = discardCard.getAttribute("card-symbol");
  return card.color === color || card.symbol === symbol;
};

// Update button visibility based on whose turn it is
function updateButtonsVisibility(activePlayerId) {
  const drawButton = document.getElementById("draw-button");
  const playButton = document.getElementById("play-button");

  if (!drawButton || !playButton) return;

  if (Number(activePlayerId) === clientId) {
    drawButton.style.display = "inline-block";
    playButton.style.display = "inline-block";
  } else {
    drawButton.style.display = "none";
    playButton.style.display = "none";
  }
}

// Update opponent hand counts using server data
function updateHandCounts(updatedHandCounts) {
  if (!updatedHandCounts) return;
  for (const [id, count] of Object.entries(updatedHandCounts)) {
    if (Number(id) !== clientId) {
      const playerHandCount = document.getElementById(`hand-${id}`);
      if (playerHandCount) {
        playerHandCount.innerText = count + "X";
      }
    }
  }
}

// Initialize Socket.io
const socket = io({ query: { id: gameId } });

// Initially set button visibility
updateButtonsVisibility(activePlayerIdInput.value);

const handleCardClick = (event) => {
  selectedId = event.target.getAttribute("id");
  const secondHalfOfId = selectedId.split("-")[1];
  selectedCardId = secondHalfOfId.substring(5);
  for (let j = 0; j < hand.length; j++) {
    if (hand.item(j) !== event.target) hand.item(j).classList.remove("selected");
  }
  event.target.classList.toggle("selected");
};

socket.on("card-played", (data) => {
  const client = document.getElementsByClassName("client-hand")[0];
  const newSrc = `/images/cards/${data.color}_${data.symbol}.png`;
  const activeCard = document.getElementById("discard-card");
  activeCard.setAttribute("src", newSrc);
  activeCard.setAttribute("card-color", data.color);
  activeCard.setAttribute("card-symbol", data.symbol);

  if (clientId === Number(data.clientId)) {
    const cardToRemove = document.getElementById(`game#${gameId}-card#${data.cardId}`);
    if (cardToRemove) cardToRemove.remove();
    client.style.border = "none";
  } else {
    // Update opponent's hand count directly from updatedHandCounts
  }

  // Highlight current player
  if (clientId === Number(data.activePlayerId)) {
    client.style.border = "black solid 10px";
  } else {
    const opponentElement = document.getElementById(`opponent-${data.activePlayerId}`);
    if (opponentElement) opponentElement.style.border = "red solid 3px";
  }

  // Update counts and buttons
  activePlayerIdInput.value = data.activePlayerId;
  updateButtonsVisibility(data.activePlayerId);
  updateHandCounts(data.updatedHandCounts);
});

socket.on("card-drawn", (data) => {
  const client = document.getElementsByClassName("client-hand")[0];
  if (clientId === Number(data.clientId)) {
    const newCard = document.createElement("img");
    newCard.setAttribute("src", `/images/cards/${data.drawnColor}_${data.drawnSymbol}.png`);
    newCard.setAttribute("class", "hand-card");
    newCard.setAttribute("id", `game#${gameId}-card#${data.drawnId}`);
    newCard.setAttribute("card-color", data.drawnColor);
    newCard.setAttribute("card-symbol", data.drawnSymbol);
    newCard.addEventListener("click", handleCardClick);
    client.appendChild(newCard);
    client.style.border = "none";
  }

  if (clientId === Number(data.activePlayerId)) {
    client.style.border = "black solid 10px";
  } else {
    const opponentElement = document.getElementById(`opponent-${data.activePlayerId}`);
    if (opponentElement) opponentElement.style.border = "red solid 3px";
  }

  activePlayerIdInput.value = data.activePlayerId;
  updateButtonsVisibility(data.activePlayerId);
  updateHandCounts(data.updatedHandCounts);
});

socket.on("cards-drawn", (data) => {
  if (clientId === Number(data.currentPlayerId)) {
    const client = document.getElementsByClassName("client-hand")[0];
    data.cards.forEach((card) => {
      const newCard = document.createElement("img");
      newCard.setAttribute("src", `/images/cards/${card.color}_${card.symbol}.png`);
      newCard.setAttribute("class", "hand-card");
      newCard.setAttribute("id", `game#${gameId}-card#${card.id}`);
      newCard.setAttribute("card-color", card.color);
      newCard.setAttribute("card-symbol", card.symbol);
      newCard.addEventListener("click", handleCardClick);
      client.appendChild(newCard);
    });
  }

  activePlayerIdInput.value = data.activePlayerId;
  updateButtonsVisibility(data.activePlayerId);
  updateHandCounts(data.updatedHandCounts);
});

socket.on("is-win", (data) => {
  const winnerName = data.winnerName;
  document.getElementById("winner-header").innerText = `${winnerName} won!`;
  document.getElementById("winner-div").classList.remove("hidden");
});

// Setup card click listeners
const hand = document.getElementsByClassName("hand-card");
for (let i = 0; i < hand.length; i++) {
  hand.item(i).addEventListener("click", handleCardClick);
}

const playButton = document.getElementById("play-button");
if (playButton) {
  playButton.addEventListener("click", async (event) => {
    event.preventDefault();
    const selectedCardElement = document.getElementById(selectedId);
    if (!selectedCardElement) return;

    let cardColor = selectedCardElement.getAttribute("card-color");
    const selectedCard = {
      color: cardColor,
      symbol: selectedCardElement.getAttribute("card-symbol"),
    };

    if (!isLegalMove(selectedCard)) {
      alert("Illegal move");
      return;
    }

    if (selectedCard.color === "wild") {
      cardColor = prompt("Choose a color: red, blue, green, or yellow");
      if (!cardColor) return;
    }

    try {
      await fetch(`http://localhost:3000/game/${gameId}/card/play`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: selectedCardId,
          color: cardColor,
          symbol: selectedCard.symbol,
        }),
      });
    } catch (error) {
      console.error("Error playing card:", error);
    }
  });
}

const drawButton = document.getElementById("draw-button");
if (drawButton) {
  drawButton.addEventListener("click", async () => {
    try {
      await fetch(`http://localhost:3000/game/${gameId}/card/draw`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error drawing card:", error);
    }
  });
}

const returnHomeButton = document.getElementById("return-home-button");
if (returnHomeButton) {
  returnHomeButton.addEventListener("click", async () => {
    try {
      const res = await fetch(`http://localhost:3000/game/${gameId}/abandon`, {
        method: "POST"
      });

      if (res.ok) {
        window.location.href = "/home"; // Redirect after successful deletion
      } else {
        alert("Error ending the game. Please try again.");
      }
    } catch (error) {
      console.error("Error ending the game:", error);
    }
  });
}
