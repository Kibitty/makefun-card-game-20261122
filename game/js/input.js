// Emberfall Duel — mouse and keyboard. Every action has both: click a
// card or press its number, click End Turn or press E, click Start or
// press Enter, press R to duel again after the end screen.

export function bindKeyboard(ui) {
  document.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === 'enter' || key === ' ') {
      event.preventDefault();
      ui.onConfirm();
      return;
    }
    if (key === 'e') {
      ui.onEndTurn();
      return;
    }
    if (key === 'r') {
      ui.onRestart();
      return;
    }
    if (key >= '1' && key <= '7') {
      ui.onPlayIndex(Number(key) - 1);
    }
  });
}

export function bindButtons(ui) {
  document.getElementById('start-btn').addEventListener('click', () => ui.onConfirm());
  document.getElementById('end-turn').addEventListener('click', () => ui.onEndTurn());
  document.getElementById('again-btn').addEventListener('click', () => ui.onRestart());
}
