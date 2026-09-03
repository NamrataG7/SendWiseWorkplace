// options.js — SendWiseWorkplace options page.

const CATEGORY_KEYS = [
  "sexual_harassment",
  "hate_speech_caste_religion",
  "hate_speech_gender_lgbtq",
  "hate_speech_disability",
  "hate_speech_race",
  "threats_intimidation",
  "harassment_general",
  "self_harm"
];

function get(keys) {
  return new Promise((r) => chrome.storage.local.get(keys, r));
}
function set(obj) {
  return new Promise((r) => chrome.storage.local.set(obj, r));
}
function flash(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = "saved";
  setTimeout(() => (el.textContent = ""), 1200);
}

async function render() {
  const v = await get(["enabled", "categories", "ingest_url", "counters"]);
  document.getElementById("enabled").checked = v.enabled !== false;

  const catContainer = document.getElementById("categories");
  catContainer.innerHTML = "";
  const cats = v.categories || {};
  CATEGORY_KEYS.forEach((k) => {
    const row = document.createElement("div");
    row.className = "row";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.id = "cat_" + k;
    cb.checked = cats[k] !== false;
    cb.addEventListener("change", async () => {
      const cur = (await get(["categories"])).categories || {};
      cur[k] = cb.checked;
      await set({ categories: cur });
    });
    const label = document.createElement("label");
    label.htmlFor = cb.id;
    label.textContent = k.replace(/_/g, " ");
    row.appendChild(cb);
    row.appendChild(label);
    catContainer.appendChild(row);
  });

  document.getElementById("ingest_url").value =
    v.ingest_url || "http://localhost:3000/api/violations";

  const c = v.counters || { detected: 0, edited: 0, sent_anyway: 0, cancelled: 0 };
  document.getElementById("c_detected").textContent = c.detected || 0;
  document.getElementById("c_edited").textContent = c.edited || 0;
  document.getElementById("c_sent_anyway").textContent = c.sent_anyway || 0;
  document.getElementById("c_cancelled").textContent = c.cancelled || 0;
}

document.addEventListener("DOMContentLoaded", () => {
  render();

  document.getElementById("enabled").addEventListener("change", async (e) => {
    await set({ enabled: e.target.checked });
    flash("saved-enabled");
  });

  document.getElementById("save_url").addEventListener("click", async () => {
    const url = document.getElementById("ingest_url").value.trim();
    await set({ ingest_url: url || "http://localhost:3000/api/violations" });
    flash("saved-url");
  });

  document.getElementById("reset").addEventListener("click", async () => {
    await set({ counters: { detected: 0, edited: 0, sent_anyway: 0, cancelled: 0 } });
    render();
  });

  // Live refresh counters if they change while page is open.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.counters) render();
  });
});
