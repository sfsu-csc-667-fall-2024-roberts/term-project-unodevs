import { io } from "https://cdn.skypack.dev/socket.io-client"; 

let selectedId;
let selectedCardId;
const gameId = Number(document.getElementById("game-id").value);
const clientId = Number(document.getElementById("client-id").value);
const activePlayerIdInput = document.getElementById("active-player-id");

// Function to determine if a card can be legally played
const isLegalMove = (card) => {
  if (card.color === "wild") return true;
  const discardCard = document.getElementById("discard-card");
  const color = discardCard.getAttribute("card-color");
  const symbol = discardCard.getAttribute("card-symbol");
  console.log(
    `Discard card color: ${color}, symbol: ${symbol}, card color: ${card.color}, symbol: ${card.symbol}`
  );
  return card.color === color || card.symbol === symbol;
};

// Function to update visibility of buttons based on whose turn it is
function updateButtonsVisibility(activePlayerId) {
  const drawButton = document.getElementById("draw-button");
  const playButton = document.getElementById("play-button");
  const unoButton = document.getElementById("uno-button");

  if (!drawButton || !playButton || !unoButton) return;

  if (Number(activePlayerId) === clientId) {
    drawButton.style.display = "inline-block";
    playButton.style.display = "inline-block";
    unoButton.style.display = "inline-block";
  } else {
    drawButton.style.display = "none";
    playButton.style.display = "none";
    unoButton.style.display = "none";
  }
}

// Initialize Socket.io
const socket = io({ query: { id: gameId } });

// Initially set button visibility based on current active player
updateButtonsVisibility(activePlayerIdInput.value);

// Card click event handler
const handleCardClick = (event) => {
  selectedId = event.target.getAttribute("id");
  const secondHalfOfId = selectedId.split("-")[1];
  selectedCardId = secondHalfOfId.substring(5);
  for (let j = 0; j < hand.length; j++) {
    if (hand.item(j) !== event.target) hand.item(j).classList.remove("selected");
  }
  event.target.classList.toggle("selected");
};

// Listen for "card-played" event
socket.on("card-played", (data) => {
  const client = document.getElementsByClassName("client-hand")[0];
  const newSrc = `/images/cards/${data.color}_${data.symbol}.png`;
  const activeCard = document.getElementById("discard-card");
  activeCard.setAttribute("src", newSrc);
  activeCard.setAttribute("card-color", data.color);
  activeCard.setAttribute("card-symbol", data.symbol);

  console.log("Card played event data:", JSON.stringify(data));

  if (clientId === Number(data.clientId)) {
    const cardToRemove = document.getElementById(`game#${gameId}-card#${data.cardId}`);
    if (cardToRemove) cardToRemove.remove();
    client.style.border = "none";
  } else {
    const playerHandCount = document.getElementById(`hand-${data.clientId}`);
    playerHandCount.innerText =
      Number(playerHandCount.innerText.slice(0, -1)) - 1 + "X";
    document.getElementById(`opponent-${data.clientId}`).style.border = "none";
  }

  // Highlight the current player’s turn
  if (clientId === Number(data.activePlayerId)) {
    client.style.border = "black solid 10px";
  } else {
    const opponentElement = document.getElementById(`opponent-${data.activePlayerId}`);
    if (opponentElement) opponentElement.style.border = "yellow solid 3px";
  }

  // Update active player and button visibility
  activePlayerIdInput.value = data.activePlayerId;
  updateButtonsVisibility(data.activePlayerId);
});

// Listen for "card-drawn" event
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
  } else {
    const playerHandCount = document.getElementById(`hand-${data.clientId}`);
    playerHandCount.innerText =
      Number(playerHandCount.innerText.slice(0, -1)) + 1 + "X";
    document.getElementById(`opponent-${data.clientId}`).style.border = "none";
  }

  if (clientId === Number(data.activePlayerId)) {
    client.style.border = "black solid 10px";
  } else {
    const opponentElement = document.getElementById(`opponent-${data.activePlayerId}`);
    if (opponentElement) opponentElement.style.border = "yellow solid 3px";
  }

  // Update active player and button visibility
  activePlayerIdInput.value = data.activePlayerId;
  updateButtonsVisibility(data.activePlayerId);
});

// Listen for "cards-drawn" event (for draw_two or wild_draw_four scenarios)
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
  } else {
    const playerHandCount = document.getElementById(`hand-${data.currentPlayerId}`);
    playerHandCount.innerText =
      Number(playerHandCount.innerText.slice(0, -1)) + data.cards.length + "X";
  }

  // Update active player and button visibility
  activePlayerIdInput.value = data.activePlayerId;
  updateButtonsVisibility(data.activePlayerId);
});

// Listen for "is-win" event
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

// Play button functionality
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
      if (!cardColor) return; // If user cancels prompt
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

// Draw button functionality
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

// Return home button
const returnHomeButton = document.getElementById("return-home-button");
if (returnHomeButton) {
  returnHomeButton.addEventListener("click", () => {
    alert("TODO: Delete game");
    window.location.href = "/";
  });
}
