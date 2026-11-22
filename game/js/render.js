// Emberfall Duel — everything the eye sees: the table, the cards, the
// heroes, the log, and the win/loss flourish. The engine owns the truth;
// this file only paints it, and paints it again after every move.

import { ELEMENTS } from './cards.js';
import { MAX_LIFE } from './engine.js';

const $ = (sel, root = document) => root.querySelector(sel);

// Remember last life totals so a change can float a damage number.
const lastLife = { player: MAX_LIFE, enemy: MAX_LIFE };

export function cardFace(card, { playable = false, selected = false, mini = false } = {}) {
  const el = ELEMENTS[card.element];
  const div = document.createElement('div');
  div.className = `card el-${card.element}${playable ? ' playable' : ''}${selected ? ' selected' : ''}${mini ? ' mini' : ''}`;
  div.dataset.uid = card.uid;
  const keyword = card.keyword
    ? `<div class="keyword">${card.keyword.toUpperCase()}</div>`
    : '';
  const stats = card.kind === 'creature'
    ? `<div class="stats"><span class="atk" title="Attack">⚔ ${card.atk}</span><span class="hp" title="Health">♥ ${card.hp}</span></div>`
    : `<div class="stats spell-effect">${card.text}</div>`;
  div.innerHTML = `
    <div class="cost" style="--el:${el.color}">${card.cost}</div>
    <div class="art" style="color:${el.color}">${el.glyph}</div>
    <div class="cname">${card.name}</div>
    ${keyword}
    <div class="ctext">${card.kind === 'creature' ? card.text : ''}</div>
    ${stats}`;
  return div;
}

export function cardBack() {
  const div = document.createElement('div');
  div.className = 'card back';
  div.innerHTML = '<div class="back-glyph">▲●◆</div><div class="back-name">EMBERFALL</div>';
  return div;
}

function manaGems(el, mana, maxMana) {
  el.innerHTML = '';
  for (let i = 0; i < 10; i += 1) {
    const gem = document.createElement('span');
    gem.className = 'gem' + (i < maxMana ? (i < mana ? ' filled' : ' empty') : ' locked');
    gem.textContent = '⬢';
    el.appendChild(gem);
  }
}

function lifeBar(el, life, maxLife) {
  const pct = Math.max(0, Math.min(100, (life / maxLife) * 100));
  el.querySelector('.life-fill').style.width = `${pct}%`;
  el.querySelector('.life-num').textContent = `${Math.max(0, life)} / ${maxLife}`;
  el.classList.toggle('low', life <= 10);
}

function floatDamage(anchor, amount, kind) {
  if (!amount) return;
  const floater = document.createElement('div');
  floater.className = `floater ${kind}`;
  floater.textContent = amount > 0 ? `−${amount}` : `+${-amount}`;
  anchor.appendChild(floater);
  setTimeout(() => floater.remove(), 1100);
}

function renderHero(state, side) {
  const duelist = side === 'player' ? state.player : state.enemy;
  const root = $(`#hero-${side}`);
  root.querySelector('.hero-name').textContent = duelist.name;
  const bar = root.querySelector('.life-bar');
  const before = lastLife[side];
  lifeBar(bar, duelist.life, duelist.maxLife);
  if (duelist.life < before) floatDamage(root, before - duelist.life, 'hurt');
  if (duelist.life > before) floatDamage(root, -(duelist.life - before), 'heal');
  lastLife[side] = duelist.life;
  manaGems(root.querySelector('.mana'), duelist.mana, duelist.maxMana);
  root.querySelector('.mana-num').textContent = `${duelist.mana}/${duelist.maxMana}`;
  root.querySelector('.deck-count').textContent = `Deck ${duelist.deck.length}`;
}

function renderBoard(state, side) {
  const row = $(`#board-${side}`);
  row.innerHTML = '';
  const duelist = side === 'player' ? state.player : state.enemy;
  for (const creature of duelist.board) {
    const card = cardFace(creature, { mini: true });
    card.classList.add('on-board');
    if (creature.justPlayed) card.classList.add('just-played');
    row.appendChild(card);
  }
  for (let i = duelist.board.length; i < 5; i += 1) {
    const slot = document.createElement('div');
    slot.className = 'board-slot';
    row.appendChild(slot);
  }
}

function renderHands(state, ui) {
  const handRow = $('#hand-player');
  handRow.innerHTML = '';
  state.player.hand.forEach((card, i) => {
    const playable = state.phase === 'playing' && state.active === 'player'
      && state.player.mana >= card.cost
      && (card.kind !== 'creature' || state.player.board.length < 5);
    const el = cardFace(card, { playable, selected: ui.selected === card.uid });
    el.style.setProperty('--fan', `${(i - (state.player.hand.length - 1) / 2) * 4}deg`);
    el.addEventListener('click', () => ui.onCardClick(card.uid));
    handRow.appendChild(el);
  });
  const foeRow = $('#hand-enemy');
  foeRow.innerHTML = '';
  state.enemy.hand.forEach(() => foeRow.appendChild(cardBack()));
  $('#enemy-count').textContent = `${state.enemy.hand.length} cards`;
}

function renderLog(state) {
  const log = $('#log');
  log.innerHTML = '';
  for (const entry of state.log.slice(-7)) {
    const line = document.createElement('div');
    line.className = `log-line ${entry.side ?? ''}`;
    line.textContent = entry.text;
    log.appendChild(line);
  }
  log.scrollTop = log.scrollHeight;
}

function renderBanner(state) {
  const banner = $('#turn-banner');
  const endBtn = $('#end-turn');
  if (state.phase !== 'playing') {
    banner.textContent = '';
    endBtn.disabled = true;
    return;
  }
  if (state.active === 'player') {
    banner.textContent = `TURN ${state.turn} — YOUR MOVE`;
    banner.className = 'your-turn';
    endBtn.disabled = false;
  } else {
    banner.textContent = 'NYX IS THINKING…';
    banner.className = 'foe-turn';
    endBtn.disabled = true;
  }
}

export function renderAll(state, ui) {
  renderHero(state, 'player');
  renderHero(state, 'enemy');
  renderBoard(state, 'player');
  renderBoard(state, 'enemy');
  renderHands(state, ui);
  renderLog(state);
  renderBanner(state);
  $('#deck-player').textContent = `Deck ${state.player.deck.length}`;
  $('#deck-enemy').textContent = `Deck ${state.enemy.deck.length}`;
}

export function showScreen(name) {
  for (const screen of ['title', 'table', 'end']) {
    $(`#screen-${screen}`).classList.toggle('hidden', screen !== name);
  }
}

// The win lands with a flourish: gold confetti over the victory panel.
export function celebrate(won) {
  const layer = $('#confetti');
  layer.innerHTML = '';
  if (!won) return;
  const colors = ['#ffd34d', '#e5482f', '#2277dd', '#1d9e57', '#fff3c4'];
  for (let i = 0; i < 60; i += 1) {
    const piece = document.createElement('i');
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.9}s`;
    piece.style.animationDuration = `${1.8 + Math.random() * 1.6}s`;
    layer.appendChild(piece);
  }
}

export function fillEndScreen(state) {
  const won = state.phase === 'won';
  $('#end-title').textContent = won ? 'VICTORY' : 'DEFEAT';
  $('#end-title').className = won ? 'win' : 'lose';
  $('#end-sub').textContent = won
    ? 'Nyx falls. The Emberfall crown is yours.'
    : 'Your flame gutters out. Nyx takes the duel.';
  $('#end-stats').innerHTML =
    `Turns played: <b>${state.turn}</b> &nbsp;·&nbsp; Your life: <b>${Math.max(0, state.player.life)}</b> &nbsp;·&nbsp; Nyx's life: <b>${Math.max(0, state.enemy.life)}</b>`;
  celebrate(won);
}
