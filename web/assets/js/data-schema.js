(function () {
  "use strict";

  const schemaVersion = 2;
  const familiarityLevels = ["不認識", "有印象", "快記住了", "已熟悉", "完全掌握"];
  const languageCodes = ["english", "japanese", "german"];

  function normalizeWord(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function safeString(value, fallback) {
    const text = String(value == null ? "" : value).trim();
    return text || fallback || "";
  }

  function isIsoDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
  }

  function sanitizeWord(raw, fallbackSource) {
    if (!raw || typeof raw !== "object") {
      return null;
    }
    const word = safeString(raw.word, "");
    const language = languageCodes.includes(raw.language) ? raw.language : "english";
    if (!word) {
      return null;
    }
    const sourceLessonId = safeString(raw.sourceLessonId, fallbackSource && fallbackSource.id);
    const sourceLessonSlug = safeString(raw.sourceLessonSlug, fallbackSource && fallbackSource.slug);
    const normalizedWord = normalizeWord(raw.normalizedWord || word);
    const id = safeString(raw.id, `${language}-${sourceLessonId || "manual"}-${normalizedWord.replace(/[^a-z0-9]+/g, "-")}`);
    const familiarity = familiarityLevels.includes(raw.familiarity) ? raw.familiarity : "不認識";
    return {
      id,
      word,
      normalizedWord,
      pronunciation: safeString(raw.pronunciation, ""),
      partOfSpeech: safeString(raw.partOfSpeech, "unknown"),
      chineseDefinition: safeString(raw.chineseDefinition, "未提供中文解釋"),
      englishDefinition: safeString(raw.englishDefinition, ""),
      example: safeString(raw.example, raw.sourceSentence || ""),
      sourceSentence: safeString(raw.sourceSentence, raw.example || ""),
      sourceTitle: safeString(raw.sourceTitle, fallbackSource && fallbackSource.title),
      sourceLessonId,
      sourceLessonSlug,
      language,
      tags: Array.isArray(raw.tags) ? raw.tags.map((tag) => safeString(tag, "")).filter(Boolean).slice(0, 12) : [],
      familiarity,
      createdAt: isIsoDate(raw.createdAt) ? raw.createdAt : window.JLL.storage ? window.JLL.storage.todayIso() : "",
      lastReviewedAt: isIsoDate(raw.lastReviewedAt) ? raw.lastReviewedAt : "",
      nextReviewDate: isIsoDate(raw.nextReviewDate) ? raw.nextReviewDate : ""
    };
  }

  function vocabularyKey(word) {
    const sanitized = sanitizeWord(word);
    if (!sanitized) {
      return "";
    }
    return [sanitized.normalizedWord, sanitized.language, sanitized.sourceLessonId || "manual"].join("|");
  }

  function validateVocabularyList(items, fallbackSource) {
    const words = [];
    const invalid = [];
    (Array.isArray(items) ? items : []).forEach((item, index) => {
      const sanitized = sanitizeWord(item, fallbackSource);
      if (sanitized) {
        words.push(sanitized);
      } else {
        invalid.push({ index, reason: "Missing required word data" });
      }
    });
    return { words, invalid };
  }

  function validateExportPayload(payload) {
    if (!payload || typeof payload !== "object") {
      return { ok: false, message: "檔案不是有效的 JSON 物件。" };
    }
    if (payload.schemaVersion !== 1 && payload.schemaVersion !== schemaVersion) {
      return { ok: false, message: "不支援的 schemaVersion。" };
    }
    if (payload.application !== "Jasper Language Lab") {
      return { ok: false, message: "這不是 Jasper Language Lab 的備份檔。" };
    }
    if (!Array.isArray(payload.vocabulary)) {
      return { ok: false, message: "備份檔缺少 vocabulary 陣列。" };
    }
    return { ok: true, message: "OK" };
  }

  window.JLL = window.JLL || {};
  window.JLL.schema = {
    familiarityLevels,
    languageCodes,
    normalizeWord,
    sanitizeWord,
    schemaVersion,
    validateExportPayload,
    validateVocabularyList,
    vocabularyKey
  };
})();

