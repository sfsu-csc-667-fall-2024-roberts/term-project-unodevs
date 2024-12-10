import { io } from "https://cdn.skypack.dev/socket.io-client";

// Extract gameId from the current URL
const urlParts = window.location.pathname.split("/");
const gameId = urlParts[urlParts.length - 1];

if (!gameId || isNaN(Number(gameId))) {
  console.error("Invalid or missing Game ID in the URL.");
} else {
  console.log("Game ID detected:", gameId);

  // Initialize Socket.IO connection with gameId as a query parameter
  const socket = io({
    query: { id: gameId }, // Pass gameId in the handshake query
  });

  socket.on("connect", () => {
    console.log("Connected to the server with Game ID:", gameId);
  });

  socket.on("game-start", (data) => {
    console.log("Game started. Redirecting to game page...");
    window.location.href = `/game/${data.gameId}`;
  });

  const startGame = async () => {
    try {
      const res = await fetch("/game/startGame", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gameId }),
      });

      if (res.status === 200) {
        console.log("Game started successfully. Waiting for server confirmation...");
      } else {
        console.error("Failed to start the game:", await res.text());
      }
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };

  const startButton = document.getElementById("start-button");
  if (startButton) {
    startButton.addEventListener("click", startGame);
  } else {
    console.error("Start button not found.");
  }

  const leaveButton = document.getElementById("leave-button");
  if (leaveButton) {
    leaveButton.addEventListener("click", async () => {
      try {
        const res = await fetch(`/game/${gameId}/abandon`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (res.status === 200) {
          console.log("Game abandoned successfully. Redirecting to homepage...");
          window.location.href = "/home";
        } else {
          console.error("Failed to abandon the game:", await res.text());
        }
      } catch (error) {
        console.error("Error abandoning the game:", error);
      }
    });
  } else {
    console.error("Leave button not found.");
  }
}
