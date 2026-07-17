'use strict';

/**
 * Offline bot player ("the computer").
 *
 * No network, no API key — the bot scores cards with a handful of heuristics
 * that approximate why a Cards Against Humanity answer lands:
 *
 *  - punch      short, blunt answers ("Shame.") are funny
 *  - story      long absurd mini-scenarios are also funny
 *  - surprise   answers unrelated to the prompt beat on-the-nose ones
 *  - taboo      it's this game; crude answers score
 *  - specific   concrete nouns beat vague abstractions
 *  - fit        the answer should read grammatically in the blank
 *
 * punch and story pull in opposite directions on purpose: the deadest cards are
 * the mid-length ones that are neither a jab nor a bit. Each persona weights the
 * features differently, so bots don't all converge on the same answer.
 */

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'for',
  'with', 'is', 'it', 'its', 'my', 'your', 'his', 'her', 'their', 'our', 'that',
  'this', 'was', 'were', 'be', 'been', 'am', 'are', 'i', 'you', 'he', 'she',
  'they', 'we', 'me', 'him', 'them', 'us', 'as', 'by', 'from', 'so', 'if',
  'then', 'than', 'just', 'about', 'what', 'why', 'how', 'when', 'who',
]);

// Crude-but-not-hateful markers. This is an 18+ party game; answers that flirt
// with the taboo are the whole point, so they get a nudge upward.
const TABOO_WORDS = [
  'sex', 'sexy', 'naked', 'nude', 'genitals', 'butt', 'ass', 'poop', 'fart',
  'vomit', 'blood', 'death', 'dead', 'corpse', 'murder', 'killing', 'kill',
  'crime', 'drugs', 'cocaine', 'meth', 'booze', 'drunk', 'divorce', 'god',
  'satan', 'jesus', 'hell', 'sin', 'guilt', 'shame', 'crying', 'screaming',
  'betrayal', 'prison', 'stripper', 'affair', 'hostage', 'cannibalism',
];

const PERSONAS = [
  {
    id: 'deadpan',
    name: 'DEADPAN DAVE',
    blurb: 'Answers short. Judges dry.',
    weights: { punch: 1.6, story: 0.2, surprise: 1.0, taboo: 0.6, specific: 0.8, fit: 1.2 },
    temperature: 0.35,
  },
  {
    id: 'chaos',
    name: 'CHAOS GREMLIN',
    blurb: 'Picks the unhinged option, every time.',
    weights: { punch: 0.2, story: 1.6, surprise: 1.4, taboo: 1.1, specific: 0.9, fit: 0.6 },
    temperature: 0.9,
  },
  {
    id: 'intern',
    name: 'THE INTERN',
    blurb: 'Trying way too hard to be edgy.',
    weights: { punch: 0.9, story: 0.9, surprise: 0.8, taboo: 1.7, specific: 1.0, fit: 0.9 },
    temperature: 0.6,
  },
  {
    id: 'nonsequitur',
    name: 'NON SEQUITUR 9000',
    blurb: 'Has never once answered the question.',
    weights: { punch: 0.7, story: 0.8, surprise: 2.0, taboo: 0.7, specific: 1.2, fit: 0.4 },
    temperature: 0.8,
  },
];

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

const wordCount = (text) => text.trim().split(/\s+/).filter(Boolean).length;

/** Short and blunt. Peaks at ~2 words, gone by ~8. */
function punchScore(card) {
  return clamp(1 - (wordCount(card) - 2) / 6, 0, 1);
}

/** Long and rambling. Starts at ~4 words, maxes out around ~12. */
function storyScore(card) {
  return clamp((wordCount(card) - 4) / 8, 0, 1);
}

/**
 * Rewards answers that share no vocabulary with the prompt. Restating the
 * prompt's own words is the least funny thing an answer can do.
 */
function surpriseScore(blackText, card) {
  const promptWords = new Set(tokenize(blackText));
  const cardWords = tokenize(card);
  if (cardWords.length === 0) return 0.5;
  const overlap = cardWords.filter((w) => promptWords.has(w)).length;
  return clamp(1 - overlap / cardWords.length, 0, 1);
}

function tabooScore(card) {
  const lower = card.toLowerCase();
  const hits = TABOO_WORDS.filter((w) => lower.includes(w)).length;
  return clamp(hits / 2, 0, 1);
}

/** Proper nouns and numbers read as concrete, which beats vague abstraction. */
function specificScore(card) {
  const properNouns = (card.match(/(?!^)\b[A-Z][a-z]+/g) || []).length;
  const digits = /\d/.test(card) ? 1 : 0;
  return clamp((properNouns + digits) / 2, 0, 1);
}

/**
 * Grammar fit. A card that is its own sentence ("Silence.") reads badly dropped
 * into the middle of another sentence, but reads fine when the blank ends the
 * prompt.
 */
function fitScore(blackText, card) {
  const blankAtEnd = /_{3,}[\s"'.!?]*$/.test(blackText.trim());
  const cardIsSentence = /[.!?]$/.test(card.trim());
  if (blankAtEnd) return 1;
  return cardIsSentence ? 0.55 : 1;
}

function scoreCard(persona, blackText, card) {
  const w = persona.weights;
  const features = {
    punch: punchScore(card),
    story: storyScore(card),
    surprise: surpriseScore(blackText, card),
    taboo: tabooScore(card),
    specific: specificScore(card),
    fit: fitScore(blackText, card),
  };

  let total = 0;
  for (const key of Object.keys(w)) total += w[key] * features[key];

  // Jitter keeps a persona from playing identically every round.
  return total + (Math.random() - 0.5) * persona.temperature;
}

/**
 * Weighted pick from the top slice: the bot usually plays one of its best
 * options, but not always the single best, so repeat rounds stay unpredictable.
 */
function pickFromTop(scored, topN) {
  const pool = scored.slice(0, Math.max(1, Math.min(topN, scored.length)));
  const weights = pool.map((_, i) => 1 / (i + 1)); // 1, 1/2, 1/3 …
  const total = weights.reduce((a, b) => a + b, 0);

  let roll = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return pool[i];
  }
  return pool[0];
}

let botCounter = 0;

function createBot(existingNames = []) {
  const taken = new Set(existingNames.map((n) => String(n).toUpperCase()));
  const available = PERSONAS.filter((p) => !taken.has(p.name));
  const persona = (available.length ? available : PERSONAS)[
    Math.floor(Math.random() * (available.length || PERSONAS.length))
  ];

  botCounter += 1;
  return {
    id: `bot-${Date.now().toString(36)}-${botCounter}`,
    name: persona.name,
    personaId: persona.id,
    blurb: persona.blurb,
    isBot: true,
    score: 0,
    hand: [],
  };
}

const personaFor = (bot) =>
  PERSONAS.find((p) => p.id === bot.personaId) || PERSONAS[0];

/**
 * Choose which cards to play. Returns hand indices, ordered — for pick-2
 * prompts the order is part of the joke, so both orderings are evaluated.
 */
function chooseCards(bot, blackCard, hand) {
  const persona = personaFor(bot);
  const pick = blackCard.pick || 1;

  if (hand.length < pick) return [];

  if (pick === 1) {
    const scored = hand
      .map((card, index) => ({ index, score: scoreCard(persona, blackCard.text, card) }))
      .sort((a, b) => b.score - a.score);
    return [pickFromTop(scored, 3).index];
  }

  // pick >= 2: score ordered combinations of distinct cards.
  const combos = [];
  for (let i = 0; i < hand.length; i++) {
    for (let j = 0; j < hand.length; j++) {
      if (i === j) continue;
      const combined = `${hand[i]} ${hand[j]}`;
      combos.push({
        indices: [i, j],
        score: scoreCard(persona, blackCard.text, combined),
      });
    }
  }
  combos.sort((a, b) => b.score - a.score);
  return pickFromTop(combos, 5).indices.slice(0, pick);
}

/**
 * Judge submissions as Card Czar. Scores each submission the same way it scores
 * its own plays, so a bot's taste is consistent with how it writes.
 */
function judgeSubmissions(bot, blackCard, submissions) {
  if (!submissions.length) return null;

  const persona = personaFor(bot);
  const scored = submissions
    .map((submission) => ({
      submission,
      score: scoreCard(persona, blackCard.text, submission.cards.join(' ')),
    }))
    .sort((a, b) => b.score - a.score);

  return pickFromTop(scored, 2).submission;
}

/** Rough human-ish delay so the bot doesn't answer instantly. */
function thinkingDelay(min = 1800, max = 4200) {
  return min + Math.floor(Math.random() * (max - min));
}

module.exports = {
  createBot,
  chooseCards,
  judgeSubmissions,
  thinkingDelay,
  PERSONAS,
};
