// Emberfall Duel — deck helpers: shuffle, draw, fatigue.
//
// A deck is a plain array of card objects. Draw pops from the end.
// Drawing from an empty deck hurts: 2 fatigue damage, rising by 2 each
// empty draw, so a stalled duel always ends.

export function shuffleDeck(deck, random = Math.random) {
  const pile = deck.slice();
  for (let i = pile.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [pile[i], pile[j]] = [pile[j], pile[i]];
  }
  return pile;
}

// Draw up to `count` cards. Returns { drawn, fatigued } where fatigued is
// the number of empty draws that happened (each one costs fatigue damage).
export function drawFrom(deck, count) {
  const drawn = [];
  let fatigued = 0;
  for (let i = 0; i < count; i += 1) {
    const card = deck.pop();
    if (card) drawn.push(card);
    else fatigued += 1;
  }
  return { drawn, fatigued };
}
