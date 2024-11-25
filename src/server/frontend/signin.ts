function closeError(cardId: string): void {
    const error = document.getElementById(cardId);
    if (error) {
      (error as HTMLElement).style.display = "none";
    }
  }
  