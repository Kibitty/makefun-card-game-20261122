// Emberfall Duel — boot, screens and the turn loop.
//
// Flow: title screen → Start (click or Enter) → a fresh duel → play cards
// (click or keys 1–7) → End Turn (click or E) → Nyx plays, visibly, one
// card at a time → back to you, until one hero falls → win or loss screen
// → Play Again (click or R).
//
// The window.__emberfall hook exists so a test driver can set up a
// finishing position and let the real UI finish the game; the screenshots
// are still renders of this code playing.

import { newGame, playCard, endTurn, canPlay, sideOf } from './engine.js';
import { takeEnemyTurn } from './ai.js';
import { renderAll, showScreen, fillEndScreen } from './render.js';
import { bindKeyboard, bindButtons } from './input.js';
import { sfx } from './sound.js';

let state = null;
let busy = false; // true while Nyx is taking its turn

const ui = {
  selected: null,
  onCardClick,
  onConfirm,
  onEndTurn,
  onRestart,
  onPlayIndex,
};

function onCardClick(uid) {
  if (!state || state.phase !== 'playing' || state.active !== 'player' || busy) return;
  const card = state.player.hand.find((c) => c.uid === uid);
  if (!card || !canPlay(state, 'player', card)) return;
  const wasSpell = card.kind === 'spell';
  if (playCard(state, 'player', uid)) {
    sfx.play();
    if (wasSpell) sfx.hit();
    afterAction();
  }
}

function onPlayIndex(i) {
  if (!state || state.phase !== 'playing' || state.active !== 'player' || busy) return;
  const card = state.player.hand[i];
  if (card) onCardClick(card.uid);
}

function onConfirm() {
  if (!state) {
    startDuel();
    return;
  }
  if (state.phase === 'won' || state.phase === 'lost') startDuel();
}

function onRestart() {
  if (state && (state.phase === 'won' || state.phase === 'lost')) startDuel();
}

async function onEndTurn() {
  if (!state || state.phase !== 'playing' || state.active !== 'player' || busy) return;
  busy = true;
  renderAll(state, ui);
  endTurn(state);
  afterAction();
  if (state.phase === 'playing' && state.active === 'enemy') {
    await takeEnemyTurn(state, (uid) => {
      playCard(state, 'enemy', uid);
      sfx.play();
      renderAll(state, ui);
    }, (ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    if (state.phase === 'playing') {
      endTurn(state);
      sfx.draw();
    }
  }
  busy = false;
  afterAction();
}

function afterAction() {
  renderAll(state, ui);
  if (state.phase === 'won' || state.phase === 'lost') {
    fillEndScreen(state);
    showScreen('end');
    if (state.phase === 'won') sfx.win();
    else sfx.lose();
  }
}

function startDuel() {
  state = newGame();
  busy = false;
  showScreen('table');
  renderAll(state, ui);
  sfx.draw();
}

// Debug/test hook: set up a finishing position with the game's own state,
// then finish it through the real UI. Used to photograph the win and
// loss screens from real play.
window.__emberfall = {
  get state() { return state; },
  start: startDuel,
  // Leave Nyx at 3 life and hand you an Emberbolt with the mana to cast it.
  setupWin() {
    if (!state || state.phase === 'won' || state.phase === 'lost') startDuel();
    state.enemy.life = 3;
    state.player.mana = 10;
    state.player.maxMana = 10;
    state.player.hand.push({
      kind: 'spell', id: 'emberbolt', uid: 'emberbolt#debug',
      name: 'Emberbolt', element: 'ember', cost: 2,
      effect: 'bolt:3', text: 'Deal 3 damage to the enemy hero.',
    });
    renderAll(state, ui);
  },
  // Leave you at 3 life, Nyx with a heavy board, then end your turn so
  // her creatures strike for the win.
  setupLoss() {
    if (!state || state.phase === 'won' || state.phase === 'lost') startDuel();
    state.player.life = 3;
    state.player.board = [];
    state.enemy.board = [
      { kind: 'creature', id: 'magma-colossus', uid: 'magma#debug', name: 'Magma Giant', element: 'ember', cost: 6, atk: 8, hp: 7, maxHp: 7, text: 'The mountain, awake and annoyed.' },
      { kind: 'creature', id: 'ash-wyvern', uid: 'wyvern#debug', name: 'Ash Wyvern', element: 'ember', cost: 4, atk: 5, hp: 4, maxHp: 4, keyword: 'swift', text: 'Swift — strikes the turn it is played.' },
    ];
    renderAll(state, ui);
  },
};

bindKeyboard(ui);
bindButtons(ui);
showScreen('title');
