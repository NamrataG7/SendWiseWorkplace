// background.js — SendWiseWorkplace MV3 service worker.
// - Ensures a random per-install user_id exists in chrome.storage.local
// - Receives {type:'violation', payload} messages from content scripts
// - Computes SHA-256 hash of user_id, POSTs metadata-only telemetry
// - Updates local counters for the options page
// - Silently swallows network errors (offline mode)

const DEFAULT_INGEST_URL = "http://localhost:3000/api/violations";

function uuid() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  // Fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function sha256Hex(str) {
  const buf = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function storageGet(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}
function storageSet(obj) {
  return new Promise((resolve) => chrome.storage.local.set(obj, resolve));
}

async function ensureInstallState() {
  const v = await storageGet(["user_id", "ingest_url", "enabled", "categories", "counters"]);
  const patch = {};
  if (!v.user_id) patch.user_id = uuid();
  if (!v.ingest_url) patch.ingest_url = DEFAULT_INGEST_URL;
  if (v.enabled === undefined) patch.enabled = true;
  if (!v.categories) {
    patch.categories = {
      sexual_harassment: true,
      hate_speech_caste_religion: true,
      hate_speech_gender_lgbtq: true,
      hate_speech_disability: true,
      hate_speech_race: true,
      threats_intimidation: true,
      harassment_general: true,
      self_harm: true
    };
  }
  if (!v.counters) {
    patch.counters = { detected: 0, edited: 0, sent_anyway: 0, cancelled: 0 };
  }
  if (Object.keys(patch).length) await storageSet(patch);
}

chrome.runtime.onInstalled.addListener(() => {
  ensureInstallState();
});
chrome.runtime.onStartup && chrome.runtime.onStartup.addListener(() => {
  ensureInstallState();
});

async function bumpCounter(action) {
  const { counters = { detected: 0, edited: 0, sent_anyway: 0, cancelled: 0 } } =
    await storageGet(["counters"]);
  if (action in counters) counters[action] += 1;
  await storageSet({ counters });
}

async function handleViolation(payload) {
  await ensureInstallState();
  const { user_id, ingest_url } = await storageGet(["user_id", "ingest_url"]);
  const user_id_hash = await sha256Hex(user_id);
  const body = {
    user_id_hash,
    timestamp: payload.timestamp || new Date().toISOString(),
    category: payload.category,
    severity: payload.severity,
    action: payload.action,
    session_id: payload.session_id,
    platform: payload.platform
  };
  await bumpCounter(payload.action);
  try {
    await fetch(ingest_url || DEFAULT_INGEST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true
    });
  } catch (_) {
    // Offline / unreachable — silent.
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "violation" && msg.payload) {
    handleViolation(msg.payload).then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
    return true; // async
  }
});
