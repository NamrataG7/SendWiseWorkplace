/**
 * SendWise RF classifier — JS port of the trained scikit-learn RandomForest + TF-IDF pipeline.
 *
 * Loads two models exported by model_training/ (via export script):
 *   - rf_binary.json    : is-this-risky (non_risk vs risk), threshold 0.5
 *   - rf_category.json  : which-category (harassment, threats, hate_speech, sexual_content, self_harm)
 *
 * Workplace category mapping — the trained model has the 5 upstream SendWise categories.
 * We map them onto the 11 workplace categories from PLAN.md at inference time. Categories
 * without a trained model signal (bullying_persistent, power_abuse, psychological_safety_erosion,
 * and the caste/gender/disability/race splits of hate_speech) fall back to the parent
 * category or to the keyword classifier as a supplement.
 */

const RF = (() => {
  let binary = null;   // {task, n_features, classes, threshold, vocabulary, idf, trees}
  let category = null;

  // Match the sklearn TfidfVectorizer default token pattern: r"(?u)\b\w\w+\b"
  // i.e. word tokens of 2+ word chars. Case-insensitive (lowercase before match).
  const TOKEN_RE = /\b[\w]{2,}\b/g;

  function tokenize(text) {
    return String(text || '').toLowerCase().match(TOKEN_RE) || [];
  }

  // Build TF-IDF vector as sparse map {featureIndex: weight}, L2-normalized (sklearn default).
  function vectorize(text, vocab, idf) {
    const tokens = tokenize(text);
    if (tokens.length === 0) return {};
    const counts = new Map();
    for (const tok of tokens) {
      const idx = vocab[tok];
      if (idx === undefined) continue;
      counts.set(idx, (counts.get(idx) || 0) + 1);
    }
    if (counts.size === 0) return {};
    // tf * idf
    const vec = {};
    let norm = 0;
    for (const [idx, tf] of counts) {
      const w = tf * idf[idx];
      vec[idx] = w;
      norm += w * w;
    }
    // L2 normalize
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (const k in vec) vec[k] /= norm;
    }
    return vec;
  }

  // Walk one decision tree; return the per-class value array at the reached leaf.
  function treePredict(tree, x) {
    let node = 0;
    const { f, t, l, r } = tree;
    while (l[node] !== -1) {
      const feat = f[node];
      const val = x[feat] || 0;
      node = val <= t[node] ? l[node] : r[node];
    }
    return tree.v[node];
  }

  // Random Forest: average class-probability across trees.
  function rfPredictProba(model, x) {
    const K = model.classes.length;
    const sum = new Array(K).fill(0);
    for (const tree of model.trees) {
      const leaf = treePredict(tree, x);
      let total = 0;
      for (let k = 0; k < K; k++) total += leaf[k];
      if (total === 0) continue;
      for (let k = 0; k < K; k++) sum[k] += leaf[k] / total;
    }
    const T = model.trees.length;
    for (let k = 0; k < K; k++) sum[k] /= T;
    return sum;
  }

  async function loadModel(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    return await res.json();
  }

  async function init() {
    if (binary && category) return;
    const binURL = chrome.runtime.getURL('models/rf_binary.json');
    const catURL = chrome.runtime.getURL('models/rf_category.json');
    [binary, category] = await Promise.all([loadModel(binURL), loadModel(catURL)]);
  }

  // Severity mapping from binary risk probability.
  function severityFromRisk(p) {
    if (p >= 0.85) return 'high';
    if (p >= 0.60) return 'medium';
    if (p >= 0.50) return 'low';
    return null;
  }

  // Map upstream 5-class category → workplace category taxonomy (PLAN.md).
  // Additional keyword refinements (e.g. caste vs race vs LGBTQ splits) happen in the
  // hybrid classifier by consulting the keyword rules AFTER the RF pick.
  const CATEGORY_MAP = {
    harassment: 'harassment_general',
    threats: 'threats_intimidation',
    hate_speech: 'hate_speech_gender_lgbtq', // default; keyword classifier refines split
    sexual_content: 'sexual_harassment',
    self_harm: 'self_harm',
  };

  async function classify(text) {
    if (!text || text.trim().length < 3) return null;
    try {
      await init();
    } catch (e) {
      return null; // model unavailable — caller may fall back to keyword classifier
    }

    // Binary risk gate
    const xBin = vectorize(text, binary.vocabulary, binary.idf);
    const probs = rfPredictProba(binary, xBin);
    const pRisk = probs[binary.classes.indexOf('risk')];
    if (pRisk < binary.threshold) return null;

    const severity = severityFromRisk(pRisk);
    if (!severity) return null;

    // Category
    const xCat = vectorize(text, category.vocabulary, category.idf);
    const catProbs = rfPredictProba(category, xCat);
    let bestIdx = 0;
    let bestVal = catProbs[0];
    for (let i = 1; i < catProbs.length; i++) {
      if (catProbs[i] > bestVal) {
        bestVal = catProbs[i];
        bestIdx = i;
      }
    }
    const upstreamCat = category.classes[bestIdx];
    let workplaceCat = CATEGORY_MAP[upstreamCat] || 'harassment_general';

    // Refine hate_speech split with keyword classifier if available.
    if (upstreamCat === 'hate_speech' && typeof self !== 'undefined' && self.SWClassifier) {
      const kw = self.SWClassifier.classify(text);
      if (kw && kw.category && kw.category.startsWith('hate_speech_')) {
        workplaceCat = kw.category;
      }
    }

    return {
      category: workplaceCat,
      severity,
      confidence: Math.round(pRisk * 100) / 100,
      source: 'rf',
      upstream_category: upstreamCat,
    };
  }

  // Hybrid: try RF first; if RF says non-risk but keyword rules match, still surface.
  async function classifyHybrid(text) {
    const rfRes = await classify(text);
    if (rfRes) return rfRes;
    if (typeof self !== 'undefined' && self.SWClassifier) {
      const kw = self.SWClassifier.classify(text);
      if (kw) return { ...kw, source: 'keyword' };
    }
    return null;
  }

  return { classify, classifyHybrid, init, _tokenize: tokenize };
})();

if (typeof self !== 'undefined') self.SWRfClassifier = RF;
