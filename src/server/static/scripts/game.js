import { io } from "https://cdn.skypack.dev/socket.io-client"; // Required for socket.io client

let selectedId;
let selectedCardId;
const gameId = Number(document.getElementById("game-id").value);
const clientId = Number(document.getElementById("client-id").value);

// Check if the card argument is allowed to be played
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


// Initialize Socket.io
const socket = io({ query: { id: gameId } });

socket.on("card-played", (data) => {
  const client = document.getElementsByClassName("client-hand")[0];
  const newSrc = `/images/cards/${data.color}_${data.symbol}.png`;
  const activeCard = document.getElementById("discard-card");
  activeCard.setAttribute("src", newSrc);
  activeCard.setAttribute("card-color", data.color);
  activeCard.setAttribute("card-symbol", data.symbol);

  console.log("Card played event data:", JSON.stringify(data));

  if (clientId === Number(data.clientId)) {
    const cardToRemove = document.getElementById(
      `game#${gameId}-card#${data.cardId}`
    );
    cardToRemove.remove();
    client.style.border = "none";
  } else {
    const playerHandCount = document.getElementById(`hand-${data.clientId}`);
    playerHandCount.innerText =
      Number(playerHandCount.innerText.slice(0, -1)) - 1 + "X";
    document.getElementById(`opponent-${data.clientId}`).style.border = "none";
  }


  if (clientId === Number(data.activePlayerId)) {
    client.style.border = "black solid 10px";
  } else {
    document.getElementById(`opponent-${data.activePlayerId}`).style.border =
      "yellow solid 3px";
  }
});

socket.on("cards-drawn", (data) => {
  if (clientId === Number(data.currentPlayerId)) {
    const client = document.getElementsByClassName("client-hand")[0];
    data.cards.forEach((card) => {
      const newCard = document.createElement("img");
      newCard.setAttribute(
        "src",
        `/images/cards/${card.color}_${card.symbol}.png`
      );
      newCard.setAttribute("class", "hand-card");
      newCard.setAttribute("id", `game#${gameId}-card#${card.id}`);
      newCard.setAttribute("card-color", card.color);
      newCard.setAttribute("card-symbol", card.symbol);
      newCard.addEventListener("click", handleCardClick);
      client.appendChild(newCard);
    });
  } else {
    const playerHandCount = document.getElementById(
      `hand-${data.currentPlayerId}`
    );
    playerHandCount.innerText =
      Number(playerHandCount.innerText.slice(0, -1)) + data.cards.length + "X";
    document.getElementById(`opponent-${data.clientId}`).style.border = "none";
  }
});

socket.on("card-drawn", (data) => {
  const client = document.getElementsByClassName("client-hand")[0];
  if (clientId === Number(data.clientId)) {
    const newCard = document.createElement("img");
    newCard.setAttribute(
      "src",
      `/images/cards/${data.drawnColor}_${data.drawnSymbol}.png`
    );
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
    document.getElementById(`opponent-${data.activePlayerId}`).style.border =
      "yellow solid 3px";
  }

});

socket.on("is-win", (data) => {
  const winnerName = data.winnerName;
  document.getElementById("winner-header").innerText = `${winnerName} won!`;
  document.getElementById("winner-div").classList.remove("hidden");
});

// Card click event handler
const handleCardClick = (event) => {
  selectedId = event.target.getAttribute("id");
  const secondHalfOfId = selectedId.split("-")[1];
  selectedCardId = secondHalfOfId.substring(5);
  for (let j = 0; j < hand.length; j++) {
    if (hand.item(j) !== event.target)
      hand.item(j).classList.remove("selected");
  }
  event.target.classList.toggle("selected");
};

// Setup card click listeners
const hand = document.getElementsByClassName("hand-card");
for (let i = 0; i < hand.length; i++) {
  hand.item(i).addEventListener("click", handleCardClick);
}

// Play button functionality
const playButton = document.getElementById("play-button");
playButton.addEventListener("click", async (event) => {
  event.preventDefault();
  let cardColor = document
    .getElementById(selectedId)
    .getAttribute("card-color");
  const selectedCard = {
    color: cardColor,
    symbol: document.getElementById(selectedId).getAttribute("card-symbol"),
  };
  if (!isLegalMove(selectedCard)) {
    alert("Illegal move");
    return;
  }
  if (selectedCard.color === "wild") {
    cardColor = prompt("Choose a color: red, blue, green, or yellow");
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

// Draw button functionality
const drawButton = document.getElementById("draw-button");
drawButton.addEventListener("click", async () => {
  try {
    await fetch(`http://localhost:3000/game/${gameId}/card/draw`, {
      method: "POST",
    });
  } catch (error) {
    console.error("Error drawing card:", error);
  }
});

// Return home button
const returnHomeButton = document.getElementById("return-home-button");
returnHomeButton.addEventListener("click", () => {
  alert("TODO: Delete game");
  window.location.href = "/";
});
