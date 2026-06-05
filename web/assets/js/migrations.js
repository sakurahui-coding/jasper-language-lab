(function () {
  "use strict";

  function migrateState(rawState) {
    const state = rawState && typeof rawState === "object" ? rawState : {};
    const migrated = {
      schemaVersion: window.JLL.schema.schemaVersion,
      reviewHistory: Array.isArray(state.reviewHistory) ? state.reviewHistory : [],
      settings: state.settings && typeof state.settings === "object" ? state.settings : {},
      lastOpenedLesson: state.lastOpenedLesson || null,
      lessonReadingProgress: state.lessonReadingProgress && typeof state.lessonReadingProgress === "object" ? state.lessonReadingProgress : {},
      recentlyViewedLessons: Array.isArray(state.recentlyViewedLessons) ? state.recentlyViewedLessons : [],
      lastBackupAt: state.lastBackupAt || ""
    };
    return migrated;
  }

  function migrateVocabulary(rawVocabulary) {
    const result = window.JLL.schema.validateVocabularyList(rawVocabulary);
    if (result.invalid.length) {
      console.warn(`Jasper Language Lab migration skipped ${result.invalid.length} invalid vocabulary records.`);
    }
    return result.words;
  }

  function migrateActivity(rawActivity) {
    const activity = rawActivity && typeof rawActivity === "object" ? rawActivity : {};
    return {
      correct: Number(activity.correct) || 0,
      incorrect: Number(activity.incorrect) || 0,
      lastStudyDate: typeof activity.lastStudyDate === "string" ? activity.lastStudyDate : "",
      streak: Number(activity.streak) || 1
    };
  }

  window.JLL = window.JLL || {};
  window.JLL.migrations = {
    migrateActivity,
    migrateState,
    migrateVocabulary
  };
})();

