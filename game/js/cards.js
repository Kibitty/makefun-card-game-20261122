// Emberfall Duel — the card pool.
//
// Three elements, each told apart by colour AND shape (never text alone):
//   Ember  ▲  red-orange  — aggressive creatures and burn spells
//   Tide   ●  blue        — tough guards and healing
//   Gale   ◆  green       — fast creatures and card draw
//
// A card is one of:
//   creature: { kind:'creature', id, name, element, cost, atk, hp, keyword?, text }
//   spell:    { kind:'spell',    id, name, element, cost, text, effect }
// Keywords: 'swift' (strikes the turn it is played), 'guard' (soaks
// incoming creature damage before the hero takes any).

export const ELEMENTS = {
  ember: { label: 'Ember', glyph: '▲', color: '#e5482f', dark: '#8f1d0e', soft: '#ffd9d2' },
  tide:  { label: 'Tide',  glyph: '●', color: '#2277dd', dark: '#0d3f7d', soft: '#d2e6ff' },
  gale:  { label: 'Gale',  glyph: '◆', color: '#1d9e57', dark: '#0b5c30', soft: '#d2f2df' },
};

// Spell effect codes, resolved by the engine:
//   bolt:<n>  — deal n damage to the enemy hero
//   heal:<n>  — restore n life to your hero
//   draw:<n>  — draw n cards
//   surge:<n> — your creatures gain +n attack until end of turn
export const CARD_POOL = [
  // ---- Ember creatures ----
  { kind: 'creature', id: 'cinder-imp',   name: 'Cinder Imp',   element: 'ember', cost: 1, atk: 2, hp: 1, text: 'A spark with teeth.' },
  { kind: 'creature', id: 'flame-hound',  name: 'Flame Hound',  element: 'ember', cost: 2, atk: 3, hp: 2, text: 'It hunts in a pack of one.' },
  { kind: 'creature', id: 'ash-wyvern',   name: 'Ash Wyvern',   element: 'ember', cost: 4, atk: 5, hp: 4, keyword: 'swift', text: 'Swift — strikes the turn it is played.' },
  { kind: 'creature', id: 'magma-colossus', name: 'Magma Giant', element: 'ember', cost: 6, atk: 8, hp: 7, text: 'The mountain, awake and annoyed.' },
  // ---- Tide creatures ----
  { kind: 'creature', id: 'tide-sprite',  name: 'Tide Sprite',  element: 'tide', cost: 1, atk: 1, hp: 3, keyword: 'guard', text: 'Guard — soaks blows meant for its hero.' },
  { kind: 'creature', id: 'reef-turtle',  name: 'Reef Turtle',  element: 'tide', cost: 3, atk: 2, hp: 6, keyword: 'guard', text: 'Guard — a slow wall with a slower temper.' },
  { kind: 'creature', id: 'storm-serpent', name: 'Storm Serpent', element: 'tide', cost: 5, atk: 6, hp: 5, keyword: 'swift', text: 'Swift — strikes the turn it is played.' },
  { kind: 'creature', id: 'abyss-leviathan', name: 'Leviathan', element: 'tide', cost: 7, atk: 7, hp: 9, keyword: 'guard', text: 'Guard — the deep, surfacing.' },
  // ---- Gale creatures ----
  { kind: 'creature', id: 'thorn-fox',    name: 'Thorn Fox',    element: 'gale', cost: 2, atk: 2, hp: 3, keyword: 'swift', text: 'Swift — strikes the turn it is played.' },
  { kind: 'creature', id: 'wind-falcon',  name: 'Wind Falcon',  element: 'gale', cost: 3, atk: 4, hp: 2, keyword: 'swift', text: 'Swift — strikes the turn it is played.' },
  { kind: 'creature', id: 'grove-ancient', name: 'Grove Ancient', element: 'gale', cost: 5, atk: 4, hp: 7, keyword: 'guard', text: 'Guard — old roots, older grudges.' },
  { kind: 'creature', id: 'sky-sovereign', name: 'Sky Sovereign', element: 'gale', cost: 6, atk: 7, hp: 6, text: 'Every storm answers to it.' },
  // ---- Spells ----
  { kind: 'spell', id: 'emberbolt',   name: 'Emberbolt',   element: 'ember', cost: 2, effect: 'bolt:3', text: 'Deal 3 damage to the enemy hero.' },
  { kind: 'spell', id: 'wildfire',    name: 'Wildfire',    element: 'ember', cost: 4, effect: 'bolt:6', text: 'Deal 6 damage to the enemy hero.' },
  { kind: 'spell', id: 'tide-mend',   name: 'Tide Mend',   element: 'tide',  cost: 2, effect: 'heal:6', text: 'Restore 6 life to your hero.' },
  { kind: 'spell', id: 'deep-current', name: 'Deep Current', element: 'tide', cost: 3, effect: 'draw:2', text: 'Draw 2 cards.' },
  { kind: 'spell', id: 'gale-gust',   name: 'Gale Gust',   element: 'gale',  cost: 1, effect: 'draw:1', text: 'Draw 1 card.' },
  { kind: 'spell', id: 'war-horn',    name: 'War Horn',    element: 'gale',  cost: 2, effect: 'surge:2', text: 'Your creatures gain +2 attack this turn.' },
];

// A duel deck: two copies of every pool card, shuffled. 40 cards.
export function buildDeck() {
  const deck = [];
  for (const card of CARD_POOL) {
    deck.push({ ...card, uid: card.id + '#1' });
    deck.push({ ...card, uid: card.id + '#2' });
  }
  return deck;
}

export function elementOf(card) {
  return ELEMENTS[card.element];
}
