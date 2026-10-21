// Leitner-style spaced repetition. Pure functions so the same code runs in
// the browser (window.Srs) and in Node tests (module.exports).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Srs = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const DAY = 24 * 60 * 60 * 1000;
  const MAX_BOX = 5;
  // Days until the card is due again, indexed by box (1..5).
  const INTERVALS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };

  function newCard(id, now) {
    return { id, box: 1, due: now || Date.now(), reviews: 0, lapses: 0, lastRating: null };
  }

  function clampBox(box) {
    return Math.max(1, Math.min(MAX_BOX, box));
  }

  // rating: 'again' | 'hard' | 'good' | 'easy'
  function rate(card, rating, now) {
    now = now || Date.now();
    let box = card.box || 1;
    let lapses = card.lapses || 0;
    if (rating === 'again') { box = 1; lapses += 1; }
    else if (rating === 'hard') { box = clampBox(box); }
    else if (rating === 'good') { box = clampBox(box + 1); }
    else if (rating === 'easy') { box = clampBox(box + 2); }
    else throw new Error('Unknown rating: ' + rating);

    const days = rating === 'again' ? 0 : INTERVALS[box];
    // "again" comes back in 10 minutes inside the same session.
    const due = rating === 'again' ? now + 10 * 60 * 1000 : now + days * DAY;
    return Object.assign({}, card, {
      box, lapses, due, reviews: (card.reviews || 0) + 1, lastRating: rating, lastReview: now,
    });
  }

  function isDue(card, now) {
    return (card.due || 0) <= (now || Date.now());
  }

  // Returns the ids of cards to study now: due cards first (oldest due first),
  // then brand-new cards (not in `state`) up to `newLimit`.
  function buildQueue(allIds, state, opts) {
    opts = opts || {};
    const now = opts.now || Date.now();
    const newLimit = opts.newLimit == null ? 10 : opts.newLimit;
    const due = [];
    const fresh = [];
    allIds.forEach((id) => {
      const card = state[id];
      if (!card) fresh.push(id);
      else if (isDue(card, now)) due.push(card);
    });
    due.sort((a, b) => a.due - b.due);
    return due.map((c) => c.id).concat(fresh.slice(0, newLimit));
  }

  function summary(allIds, state, now) {
    now = now || Date.now();
    const boxes = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let seen = 0, due = 0;
    allIds.forEach((id) => {
      const card = state[id];
      if (!card) return;
      seen += 1;
      boxes[card.box] = (boxes[card.box] || 0) + 1;
      if (isDue(card, now)) due += 1;
    });
    return { total: allIds.length, seen, unseen: allIds.length - seen, due, boxes };
  }

  return { newCard, rate, isDue, buildQueue, summary, INTERVALS, MAX_BOX, DAY };
});
