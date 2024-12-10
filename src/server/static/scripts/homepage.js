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
