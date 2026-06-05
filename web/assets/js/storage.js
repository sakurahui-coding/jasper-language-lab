(function () {
  "use strict";

  const namespace = "jasperLanguageLab";
  const vocabularyKey = `${namespace}:vocabulary`;
  const activityKey = `${namespace}:activity`;
  const stateKey = `${namespace}:state`;

  function readJson(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn("localStorage read failed", error);
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn("localStorage write failed", error);
      return false;
    }
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function addDays(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function init() {
    const state = readJson(stateKey, {});
    const migratedState = window.JLL.migrations ? window.JLL.migrations.migrateState(state) : state;
    writeJson(stateKey, migratedState);

    const vocabulary = readJson(vocabularyKey, []);
    const migratedVocabulary = window.JLL.migrations ? window.JLL.migrations.migrateVocabulary(vocabulary) : vocabulary;
    writeJson(vocabularyKey, migratedVocabulary);

    const activity = readJson(activityKey, {});
    const migratedActivity = window.JLL.migrations ? window.JLL.migrations.migrateActivity(activity) : activity;
    writeJson(activityKey, migratedActivity);
  }

  function getVocabulary() {
    const words = readJson(vocabularyKey, []);
    return window.JLL.schema ? window.JLL.schema.validateVocabularyList(words).words : words;
  }

  function saveVocabulary(words) {
    const validWords = window.JLL.schema ? window.JLL.schema.validateVocabularyList(words).words : (Array.isArray(words) ? words : []);
    return writeJson(vocabularyKey, validWords);
  }

  function upsertVocabulary(word) {
    if (!word || !word.id) {
      return false;
    }
    const words = getVocabulary();
    const index = words.findIndex((item) => item.id === word.id);
    const next = window.JLL.schema ? window.JLL.schema.sanitizeWord({
      ...word,
      createdAt: word.createdAt || todayIso(),
      nextReviewDate: word.nextReviewDate || addDays(1)
    }) : {
      ...word,
      createdAt: word.createdAt || todayIso(),
      nextReviewDate: word.nextReviewDate || addDays(1)
    };
    if (!next) {
      return false;
    }
    if (index >= 0) {
      words[index] = { ...words[index], ...next };
    } else {
      words.push(next);
    }
    return saveVocabulary(words);
  }

  function removeVocabulary(id) {
    return saveVocabulary(getVocabulary().filter((word) => word.id !== id));
  }

  function getActivity() {
    return readJson(activityKey, { correct: 0, incorrect: 0, lastStudyDate: "", streak: 1 });
  }

  function saveActivity(activity) {
    return writeJson(activityKey, activity);
  }

  function getState() {
    return readJson(stateKey, {
      schemaVersion: 2,
      reviewHistory: [],
      settings: {},
      lastOpenedLesson: null,
      lessonReadingProgress: {},
      recentlyViewedLessons: [],
      lastBackupAt: ""
    });
  }

  function saveState(state) {
    const current = getState();
    return writeJson(stateKey, { ...current, ...(state || {}) });
  }

  function getReviewHistory() {
    const state = getState();
    return Array.isArray(state.reviewHistory) ? state.reviewHistory : [];
  }

  function addReviewHistory(entry) {
    const state = getState();
    const reviewHistory = Array.isArray(state.reviewHistory) ? state.reviewHistory : [];
    reviewHistory.push({
      date: todayIso(),
      timestamp: new Date().toISOString(),
      wordId: entry.wordId || "",
      word: entry.word || "",
      language: entry.language || "english",
      sourceLessonId: entry.sourceLessonId || "",
      correct: Boolean(entry.correct),
      rating: entry.rating || "",
      mode: entry.mode || ""
    });
    return saveState({ reviewHistory: reviewHistory.slice(-1000) });
  }

  function setLessonProgress(lesson, sentenceIndex, totalSentences) {
    if (!lesson || !lesson.slug) {
      return false;
    }
    const state = getState();
    const total = Math.max(1, Number(totalSentences) || 1);
    const index = Math.max(0, Number(sentenceIndex) || 0);
    const progress = Math.min(100, Math.round(((index + 1) / total) * 100));
    const lastOpenedLesson = {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      openedAt: new Date().toISOString()
    };
    const recentlyViewedLessons = [lastOpenedLesson]
      .concat((state.recentlyViewedLessons || []).filter((item) => item && item.slug !== lesson.slug))
      .slice(0, 6);
    return saveState({
      lastOpenedLesson,
      recentlyViewedLessons,
      lessonReadingProgress: {
        ...(state.lessonReadingProgress || {}),
        [lesson.slug]: {
          lessonId: lesson.id,
          slug: lesson.slug,
          title: lesson.title,
          sentenceIndex: index,
          progress,
          updatedAt: new Date().toISOString()
        }
      }
    });
  }

  window.JLL = window.JLL || {};
  window.JLL.storage = {
    addDays,
    addReviewHistory,
    getActivity,
    getReviewHistory,
    getState,
    getVocabulary,
    init,
    removeVocabulary,
    saveActivity,
    saveState,
    saveVocabulary,
    setLessonProgress,
    todayIso,
    upsertVocabulary
  };

  init();
})();
