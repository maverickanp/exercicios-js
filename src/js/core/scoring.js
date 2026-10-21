// Scores a spoken/typed answer against a question's key points.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Scoring = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const FILLERS = ['um', 'uh', 'uhm', 'er', 'erm', 'hmm', 'you know', 'kind of', 'sort of',
    'basically', 'actually', 'literally', 'i mean'];

  function normalize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/%/g, ' percent ')
      .replace(/[’']/g, "'")
      .replace(/[^a-z0-9#+.\s'-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function countWords(text) {
    const n = normalize(text);
    return n ? n.split(' ').length : 0;
  }

  // A term matches at a word boundary. Simple inflections (plural, -ed, -ing)
  // are accepted for every term, and long terms (7+ chars) match as word
  // prefixes so "invalidat" matches "invalidation" and "invalidate".
  function containsTerm(normalizedText, term) {
    const t = normalize(term);
    if (!t) return false;
    const tail = t.length >= 7 ? '[a-z]*' : '(?:s|es|ed|d|ing)?';
    const re = new RegExp('(^|[^a-z0-9#+])' + escapeRegExp(t) + tail + '(?=$|[^a-z0-9#+])', 'i');
    return re.test(normalizedText);
  }

  // keyPoints: [{ label, terms: [] }]
  function coverage(text, keyPoints) {
    const n = normalize(text);
    const results = (keyPoints || []).map((kp) => {
      const terms = kp.terms && kp.terms.length ? kp.terms : [kp.label];
      const hit = terms.find((term) => containsTerm(n, term));
      return { label: kp.label, covered: !!hit, matched: hit || null, tip: kp.tip || null };
    });
    const covered = results.filter((r) => r.covered).length;
    return {
      items: results,
      covered,
      total: results.length,
      ratio: results.length ? covered / results.length : 0,
    };
  }

  function fillerWords(text) {
    const n = normalize(text);
    const found = {};
    let total = 0;
    FILLERS.forEach((f) => {
      const re = new RegExp('(^|[^a-z])' + escapeRegExp(f) + '(?=$|[^a-z])', 'g');
      const m = n.match(re);
      if (m && m.length) { found[f] = m.length; total += m.length; }
    });
    return { total, found };
  }

  function wordsPerMinute(words, seconds) {
    if (!seconds || seconds <= 0) return 0;
    return Math.round(words / (seconds / 60));
  }

  // 110-160 wpm is a comfortable interview pace for a non-native speaker.
  function paceLabel(wpm) {
    if (!wpm) return 'n/a';
    if (wpm < 90) return 'slow';
    if (wpm <= 170) return 'good';
    return 'fast';
  }

  function lengthLabel(words) {
    if (words < 40) return 'too short';
    if (words <= 220) return 'good';
    return 'long';
  }

  // Overall 0-100 score: 70% coverage, 15% length, 15% fillers.
  function overall(text, keyPoints, seconds) {
    const words = countWords(text);
    const cov = coverage(text, keyPoints);
    const fill = fillerWords(text);
    // Pace is meaningless for very short recordings.
    const wpm = seconds >= 10 ? wordsPerMinute(words, seconds) : 0;
    const lengthScore = words < 40 ? words / 40 : words > 260 ? Math.max(0, 1 - (words - 260) / 200) : 1;
    const fillerRate = words ? fill.total / words : 0; // e.g. 0.05 = 5% fillers
    const fillerScore = Math.max(0, 1 - fillerRate * 10);
    const score = Math.round(100 * (0.7 * cov.ratio + 0.15 * lengthScore + 0.15 * fillerScore));
    return {
      score, words, seconds: seconds || 0, wpm,
      pace: paceLabel(wpm), length: lengthLabel(words),
      coverage: cov, fillers: fill,
    };
  }

  return { normalize, countWords, containsTerm, coverage, fillerWords, wordsPerMinute, paceLabel, lengthLabel, overall, FILLERS };
});
