// classifier.js — SendWiseWorkplace MVP keyword classifier.
// Academic MVP: a proper RF port lives in ../model_training/. This is a
// deterministic first-match keyword classifier used for pilot smoke-testing.
//
// Exposes window.SWClassifier.classify(text) -> {category, severity, confidence} | null

(function () {
  const BUCKETS = [
    {
      category: "sexual_harassment",
      severity: "high",
      keywords: ["sexy", "hot body", "want you", "kiss you"]
    },
    {
      category: "hate_speech_caste_religion",
      severity: "high",
      keywords: ["chamar", "bhangi", "mullah"]
    },
    {
      category: "hate_speech_gender_lgbtq",
      severity: "high",
      keywords: ["faggot", "tranny", "dyke"]
    },
    {
      category: "hate_speech_disability",
      severity: "medium",
      keywords: ["retard", "spastic", "cripple"]
    },
    {
      category: "hate_speech_race",
      severity: "high",
      keywords: ["nigger", "chink", "paki"]
    },
    {
      category: "threats_intimidation",
      severity: "high",
      keywords: ["kill you", "hurt you", "destroy you", "watch your back"]
    },
    {
      category: "harassment_general",
      severity: "medium",
      keywords: ["shut up", "you're stupid", "youre stupid", "idiot", "moron", "worthless"]
    },
    {
      category: "self_harm",
      severity: "high",
      keywords: ["kill myself", "end it all", "no reason to live"]
    }
  ];

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Precompile regexes. \b works for keywords starting/ending with word chars.
  const COMPILED = BUCKETS.map((b) => ({
    category: b.category,
    severity: b.severity,
    regex: new RegExp(
      "\\b(?:" + b.keywords.map(escapeRegex).join("|") + ")\\b",
      "i"
    )
  }));

  function classify(text) {
    if (!text || typeof text !== "string") return null;
    for (const bucket of COMPILED) {
      if (bucket.regex.test(text)) {
        return {
          category: bucket.category,
          severity: bucket.severity,
          confidence: 0.8
        };
      }
    }
    return null;
  }

  const api = { classify, BUCKETS };
  if (typeof window !== "undefined") window.SWClassifier = api;
  if (typeof self !== "undefined") self.SWClassifier = api;
})();
