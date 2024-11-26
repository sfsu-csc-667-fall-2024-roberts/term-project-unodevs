console.log("Hello from a bundled asset.");

(() => {
  let selectedCardId: string | null = null;

  const handCards = document.getElementsByClassName("hand-card");
  for (let i = 0; i < handCards.length; i++) {
    handCards.item(i)?.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      selectedCardId = target.getAttribute("cardId");

      // Remove "selected" class from all other cards
      for (let j = 0; j < handCards.length; j++) {
        if (handCards.item(j) !== target) {
          handCards.item(j)?.classList.remove("selected");
        }
      }

      // Toggle "selected" class on the clicked card
      target.classList.toggle("selected");
    });
  }

  const playButton = document.getElementById("play-button");
  playButton?.addEventListener("click", async (event) => {
    event.preventDefault();

    const payload = {
      cardId: selectedCardId,
      color: "red",
      userId: 21,
    };

    try {
      const response = await fetch("http://localhost:3000/game/3/card/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  });
})();
