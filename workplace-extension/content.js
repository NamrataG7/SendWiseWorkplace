// content.js — SendWiseWorkplace content script.
// Attaches input listeners on textareas + contenteditable elements,
// runs the keyword classifier on debounce, and shows a Shadow-DOM overlay
// nudge when a category with severity >= medium is detected.

(function () {
  const DEBOUNCE_MS = 300;
  const SEVERITY_RANK = { low: 0, medium: 1, high: 2 };
  const MIN_SEVERITY = SEVERITY_RANK.medium;

  const SESSION_ID = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const PLATFORM = detectPlatform(location.hostname);

  const attached = new WeakSet();
  const debounceTimers = new WeakMap();
  let overlayHost = null;
  let currentTarget = null;

  function detectPlatform(host) {
    if (host.endsWith("mail.google.com")) return "gmail";
    if (host.endsWith("chat.google.com")) return "google_chat";
    if (host.includes("outlook.")) return "outlook";
    if (host.includes("slack.com")) return "slack";
    if (host.includes("teams.")) return "teams";
    return "unknown";
  }

  function getText(el) {
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") return el.value || "";
    return el.innerText || el.textContent || "";
  }

  function clearText(el) {
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      el.value = "";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      el.innerText = "";
      el.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }
  }

  function attach(el) {
    if (!el || attached.has(el)) return;
    if (el.tagName !== "TEXTAREA" && !(el.getAttribute && el.getAttribute("contenteditable") === "true")) {
      return;
    }
    attached.add(el);
    el.addEventListener("input", () => onInput(el));
  }

  function onInput(el) {
    clearTimeout(debounceTimers.get(el));
    const t = setTimeout(() => runClassifier(el), DEBOUNCE_MS);
    debounceTimers.set(el, t);
  }

  async function runClassifier(el) {
    try {
      const settings = await getSettings();
      if (!settings.enabled) return;
      const text = getText(el);
      if (!text || text.length < 3) return;
      let result = null;
      if (window.SWRfClassifier) {
        result = await window.SWRfClassifier.classifyHybrid(text);
      } else if (window.SWClassifier) {
        result = window.SWClassifier.classify(text);
      }
      if (!result) return;
      if (settings.categories && settings.categories[result.category] === false) return;
      if ((SEVERITY_RANK[result.severity] ?? -1) < MIN_SEVERITY) return;
      currentTarget = el;
      showOverlay(result);
    } catch (e) {
      // Fail-open: never break the host page.
    }
  }

  function getSettings() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(["enabled", "categories"], (v) => {
          resolve({
            enabled: v.enabled !== false,
            categories: v.categories || {}
          });
        });
      } catch (_) {
        resolve({ enabled: true, categories: {} });
      }
    });
  }

  function sendTelemetry(action, result) {
    try {
      chrome.runtime.sendMessage({
        type: "violation",
        payload: {
          category: result.category,
          severity: result.severity,
          confidence: result.confidence,
          action,
          session_id: SESSION_ID,
          platform: PLATFORM,
          timestamp: new Date().toISOString()
        }
      });
    } catch (_) {}
  }

  const OVERLAY_CSS = `
    :host { all: initial; }
    .sw-banner {
      position: fixed; top: 0; left: 0; right: 0;
      z-index: 2147483647;
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px; color: #f5f5f5;
      background: #1c1c1e;
      border-bottom: 4px solid #d93025;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    }
    .sw-banner.sw-medium { border-bottom-color: #f4a100; }
    .sw-banner.sw-high { border-bottom-color: #d93025; }
    .sw-icon { font-size: 20px; }
    .sw-label { flex: 1; }
    .sw-label b { color: #fff; }
    .sw-cat { opacity: 0.85; margin-left: 6px; }
    .sw-btn {
      appearance: none; border: 0; cursor: pointer;
      padding: 6px 12px; border-radius: 4px;
      font-size: 13px; font-weight: 600;
      background: #3a3a3c; color: #fff;
    }
    .sw-btn:hover { background: #4a4a4c; }
    .sw-btn.sw-primary { background: #0a84ff; }
    .sw-btn.sw-danger { background: #d93025; }
  `;

  function showOverlay(result) {
    hideOverlay();
    overlayHost = document.createElement("div");
    overlayHost.id = "sw-overlay-host";
    const shadow = overlayHost.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = OVERLAY_CSS;
    shadow.appendChild(style);

    const banner = document.createElement("div");
    banner.className = "sw-banner sw-" + result.severity;

    const icon = document.createElement("span");
    icon.className = "sw-icon";
    icon.textContent = "\u26A0\uFE0F";

    const label = document.createElement("div");
    label.className = "sw-label";
    const catName = result.category.replace(/_/g, " ");
    label.innerHTML =
      "<b>This message may violate the workplace Code of Conduct.</b>" +
      '<span class="sw-cat">Category: ' + catName +
      " \u00B7 severity: " + result.severity + "</span>";

    const editBtn = document.createElement("button");
    editBtn.className = "sw-btn sw-primary";
    editBtn.textContent = "Edit";
    editBtn.onclick = () => {
      sendTelemetry("edited", result);
      hideOverlay();
      if (currentTarget && currentTarget.focus) currentTarget.focus();
    };

    const sendBtn = document.createElement("button");
    sendBtn.className = "sw-btn";
    sendBtn.textContent = "Send anyway";
    sendBtn.onclick = () => {
      sendTelemetry("sent_anyway", result);
      hideOverlay();
    };

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "sw-btn sw-danger";
    cancelBtn.textContent = "Cancel";
    cancelBtn.onclick = () => {
      sendTelemetry("cancelled", result);
      if (currentTarget) clearText(currentTarget);
      hideOverlay();
    };

    banner.appendChild(icon);
    banner.appendChild(label);
    banner.appendChild(editBtn);
    banner.appendChild(sendBtn);
    banner.appendChild(cancelBtn);
    shadow.appendChild(banner);

    (document.body || document.documentElement).appendChild(overlayHost);
    sendTelemetry("detected", result);
  }

  function hideOverlay() {
    if (overlayHost && overlayHost.parentNode) {
      overlayHost.parentNode.removeChild(overlayHost);
    }
    overlayHost = null;
  }

  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('textarea, [contenteditable="true"]').forEach(attach);
  }

  function boot() {
    scan(document);
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          if (n.matches && (n.matches("textarea") || n.matches('[contenteditable="true"]'))) {
            attach(n);
          }
          scan(n);
        });
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
