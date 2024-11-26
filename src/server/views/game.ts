let selectedId: string | null = null;

const handCards = document.getElementsByClassName("hand-card");
for (let i = 0; i < handCards.length; i++) {
  const card = handCards.item(i);
  card?.addEventListener("click", (event: Event) => {
    const target = event.target as HTMLElement;
    selectedId = target.getAttribute("cardId");

    for (let j = 0; j < handCards.length; j++) {
      const otherCard = handCards.item(j);
      if (otherCard !== target) {
        otherCard?.classList.remove("selected");
      }
    }

    target.classList.toggle("selected");
  });
}

const playButton = document.getElementById("play-button");
playButton?.addEventListener("click", async (event: Event) => {
  event.preventDefault();

  // Prepare request body
  const body = {
    cardId: selectedId,
    color: "red", // Placeholder color
    userId: 21, // TODO: Replace with user ID from session
  };
  const gameId = 3; // TODO: Replace with game ID from session

  try {
    const response = await fetch(
      `http://localhost:3000/game/${gameId}/card/play`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const json = await response.json();
    console.log(json);
  } catch (error) {
    console.error("An error occurred:", error);
  }
});
