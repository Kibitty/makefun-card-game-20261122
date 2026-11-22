// Emberfall Duel — Nyx, the rival. A readable opponent: it plays the
// strongest card it can afford, takes the kill when it sees one, guards
// when your board is wide, and heals when it is bleeding.
//
// choosePlays returns the uids to play, in order, from a snapshot of the
// enemy hand. The caller plays them one at a time so each card is seen
// landing on the table.

import { canPlay, sideOf, foeOf } from './engine.js';

function scoreCard(state, card) {
  const me = sideOf(state, 'enemy');
  const you = foeOf(state, 'enemy');
  if (card.kind === 'spell') {
    const [effect, amountText] = card.effect.split(':');
    const amount = Number(amountText);
    if (effect === 'bolt') {
      if (you.life - amount <= 0) return 1000; // lethal, always first
      return 22 + amount * 3; // burn is fine, but a body on the board is better
    }
    if (effect === 'heal') {
      if (me.life >= me.maxLife - 2) return 1; // full health: nearly useless
      return 25 + amount * 2 + (me.life <= 10 ? 30 : 0);
    }
    if (effect === 'draw') return me.hand.length <= 2 ? 30 : 12;
    if (effect === 'surge') return me.board.length >= 2 ? 30 + me.board.length * 6 : 4;
    return 5;
  }
  // Creature: value per mana, with a bonus for filling a role we need.
  // Board presence comes first: an empty row begs for a body.
  let score = (card.atk * 2 + card.hp) * 3 - card.cost * 4 + 12;
  if (card.keyword === 'guard' && you.board.length >= 2) score += 18;
  if (card.keyword === 'swift') score += 8;
  if (me.board.length === 0) score += 6; // an empty row begs for a body
  return score;
}

export function choosePlays(state) {
  const me = sideOf(state, 'enemy');
  const plays = [];
  let mana = me.mana;
  // Work on a copy so scoring sees the hand shrink as we commit.
  const hand = me.hand.slice();
  for (;;) {
    let best = null;
    let bestScore = 0;
    for (const card of hand) {
      if (mana < card.cost) continue;
      if (card.kind === 'creature' && me.board.length + plays.filter((u) => {
        const c = hand.find((h) => h.uid === u);
        return c && c.kind === 'creature';
      }).length >= 5) continue;
      const score = scoreCard(state, card);
      if (score > bestScore) {
        bestScore = score;
        best = card;
      }
    }
    if (!best || bestScore <= 0) break;
    plays.push(best.uid);
    mana -= best.cost;
    hand.splice(hand.indexOf(best), 1);
  }
  return plays;
}

// Nyx thinks for a beat, then plays. Returns a promise that resolves
// after every chosen card has been played, one per `step` callback.
export async function takeEnemyTurn(state, step, pause) {
  const plays = choosePlays(state);
  for (const uid of plays) {
    if (state.phase !== 'playing') break;
    const card = sideOf(state, 'enemy').hand.find((c) => c.uid === uid);
    if (!card || !canPlay(state, 'enemy', card)) continue;
    await pause(450);
    step(uid);
  }
  await pause(550);
}
