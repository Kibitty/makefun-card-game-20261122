// Emberfall Duel — the rules engine: turns, mana, combat, win and loss.
//
// One duel, two heroes at 30 life. A turn: gain 1 max mana (cap 10),
// refill mana, draw a card. Creatures join your battle row (max 5) and
// strike the enemy hero at the end of your turn; Swift creatures strike
// the turn they are played. Guard creatures soak incoming creature
// damage before the hero takes any. Spells hit at once. The hero whose
// life reaches 0 loses. An empty deck deals rising fatigue damage.

import { buildDeck } from './cards.js';
import { shuffleDeck, drawFrom } from './deck.js';

export const MAX_LIFE = 30;
export const MAX_MANA = 10;
export const MAX_HAND = 7;
export const MAX_BOARD = 5;
export const OPENING_HAND = 4;

export function newDuelist(name, isEnemy) {
  return {
    name,
    isEnemy,
    life: MAX_LIFE,
    maxLife: MAX_LIFE,
    mana: 0,
    maxMana: 0,
    deck: [],
    hand: [],
    board: [],
    fatigue: 0,
    surge: 0,
  };
}

export function newGame() {
  const state = {
    phase: 'playing',
    turn: 1,
    active: 'player',
    player: newDuelist('You', false),
    enemy: newDuelist('Nyx, the Rival', true),
    log: [],
    winner: null,
  };
  state.player.deck = shuffleDeck(buildDeck());
  state.enemy.deck = shuffleDeck(buildDeck());
  dealOpening(state.player);
  dealOpening(state.enemy);
  logLine(state, 'The duel begins. Emberfall holds its breath.');
  startTurn(state, 'player');
  return state;
}

function dealOpening(duelist) {
  const { drawn } = drawFrom(duelist.deck, OPENING_HAND);
  duelist.hand.push(...drawn);
}

export function sideOf(state, side) {
  return side === 'player' ? state.player : state.enemy;
}

export function foeOf(state, side) {
  return side === 'player' ? state.enemy : state.player;
}

export function logLine(state, text, side = null) {
  state.log.push({ turn: state.turn, side, text });
  if (state.log.length > 40) state.log.shift();
}

function startTurn(state, side) {
  const duelist = sideOf(state, side);
  duelist.maxMana = Math.min(MAX_MANA, duelist.maxMana + 1);
  duelist.mana = duelist.maxMana;
  duelist.surge = 0;
  const { drawn, fatigued } = drawFrom(duelist.deck, 1);
  for (const card of drawn) {
    if (duelist.hand.length < MAX_HAND) duelist.hand.push(card);
    else if (duelist.isEnemy) logLine(state, `Nyx drew ${card.name} — her hand is full, it burns away.`, side);
    else logLine(state, `You drew ${card.name} — your hand is full, it burns away.`, side);
  }
  if (fatigued > 0) {
    duelist.fatigue += 2;
    duelist.life -= duelist.fatigue;
    if (duelist.isEnemy) logLine(state, `Nyx draws from an empty deck — fatigue ${duelist.fatigue}.`, side);
    else logLine(state, `You draw from an empty deck — fatigue ${duelist.fatigue}.`, side);
  }
  if (duelist.isEnemy) logLine(state, `Nyx begins turn ${state.turn} (${duelist.mana} mana).`, side);
  else logLine(state, `Your turn ${state.turn} begins (${duelist.mana} mana).`, side);
  checkEnd(state);
}

export function canPlay(state, side, card) {
  if (state.phase !== 'playing' || state.active !== side) return false;
  const duelist = sideOf(state, side);
  if (duelist.mana < card.cost) return false;
  if (card.kind === 'creature' && duelist.board.length >= MAX_BOARD) return false;
  return true;
}

// Play a card from a hand. Returns true when the card was played.
export function playCard(state, side, uid) {
  const duelist = sideOf(state, side);
  const foe = foeOf(state, side);
  const index = duelist.hand.findIndex((c) => c.uid === uid);
  if (index < 0 || !canPlay(state, side, duelist.hand[index])) return false;
  const card = duelist.hand[index];
  duelist.hand.splice(index, 1);
  duelist.mana -= card.cost;

  if (card.kind === 'creature') {
    const fighter = { ...card, hp: card.hp, maxHp: card.hp, justPlayed: true };
    duelist.board.push(fighter);
    if (duelist.isEnemy) logLine(state, `Nyx summons ${card.name} (${card.atk}/${card.hp}).`, side);
    else logLine(state, `You summon ${card.name} (${card.atk}/${card.hp}).`, side);
    if (card.keyword === 'swift') {
      logLine(state, `${card.name} is Swift — it strikes at once!`, side);
      strikeWith(state, side, [fighter]);
    }
  } else {
    resolveSpell(state, side, card);
  }
  checkEnd(state);
  return true;
}

function resolveSpell(state, side, card) {
  const duelist = sideOf(state, side);
  const foe = foeOf(state, side);
  const [effect, amountText] = card.effect.split(':');
  const amount = Number(amountText);
  if (effect === 'bolt') {
    foe.life -= amount;
    logLine(state, `${card.name} — ${amount} damage straight to ${foe.isEnemy ? 'Nyx' : 'you'}!`, side);
  } else if (effect === 'heal') {
    const healed = Math.min(amount, duelist.maxLife - duelist.life);
    duelist.life += healed;
    if (duelist.isEnemy) logLine(state, `${card.name} — Nyx restores ${healed} life.`, side);
    else logLine(state, `${card.name} — you restore ${healed} life.`, side);
  } else if (effect === 'draw') {
    const { drawn, fatigued } = drawFrom(duelist.deck, amount);
    for (const drawnCard of drawn) {
      if (duelist.hand.length < MAX_HAND) duelist.hand.push(drawnCard);
    }
    if (fatigued > 0) {
      duelist.fatigue += 2;
      duelist.life -= duelist.fatigue;
      if (duelist.isEnemy) logLine(state, `Nyx draws from an empty deck — fatigue ${duelist.fatigue}.`, side);
      else logLine(state, `You draw from an empty deck — fatigue ${duelist.fatigue}.`, side);
    }
    if (duelist.isEnemy) logLine(state, `${card.name} — Nyx draws ${drawn.length}.`, side);
    else logLine(state, `${card.name} — you draw ${drawn.length}.`, side);
  } else if (effect === 'surge') {
    duelist.surge += amount;
    if (duelist.isEnemy) logLine(state, `${card.name} — Nyx's creatures gain +${amount} attack this turn!`, side);
    else logLine(state, `${card.name} — your creatures gain +${amount} attack this turn!`, side);
  }
  checkEnd(state);
}

// One creature (or a whole board) strikes the foe: guards soak first.
export function strikeWith(state, side, fighters) {
  const foe = foeOf(state, side);
  const duelist = sideOf(state, side);
  let total = 0;
  for (const fighter of fighters) total += fighter.atk + duelist.surge;
  if (total <= 0) return;
  let remaining = total;
  for (const guard of foe.board.filter((c) => c.keyword === 'guard')) {
    if (remaining <= 0) break;
    const absorbed = Math.min(guard.hp, remaining);
    guard.hp -= absorbed;
    remaining -= absorbed;
    logLine(state, `${guard.name} guards and soaks ${absorbed}.`, foe.isEnemy ? 'enemy' : 'player');
  }
  foe.board = foe.board.filter((c) => c.hp > 0);
  if (remaining > 0) {
    foe.life -= remaining;
    if (duelist.isEnemy) logLine(state, `Nyx's creatures strike you for ${remaining}.`, side);
    else logLine(state, `Your creatures strike Nyx for ${remaining}.`, side);
  }
  checkEnd(state);
}

// End the active side's turn: its board strikes, then the foe begins.
export function endTurn(state) {
  if (state.phase !== 'playing') return;
  const side = state.active;
  const duelist = sideOf(state, side);
  strikeWith(state, side, duelist.board.slice());
  if (state.phase !== 'playing') return;
  state.active = side === 'player' ? 'enemy' : 'player';
  if (state.active === 'player') state.turn += 1;
  startTurn(state, state.active);
}

function checkEnd(state) {
  if (state.phase !== 'playing') return;
  if (state.enemy.life <= 0 && state.player.life <= 0) {
    // Attacker takes it: the side that just acted wins the race.
    state.phase = state.active === 'player' ? 'won' : 'lost';
    state.winner = state.active;
  } else if (state.enemy.life <= 0) {
    state.phase = 'won';
    state.winner = 'player';
  } else if (state.player.life <= 0) {
    state.phase = 'lost';
    state.winner = 'enemy';
  }
  if (state.phase === 'won') logLine(state, 'Nyx falls. Emberfall is yours!');
  if (state.phase === 'lost') logLine(state, 'Your flame gutters out. Nyx takes the duel.');
}
