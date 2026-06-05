(function () {
  "use strict";

  const familiarityLevels = ["不認識", "有印象", "快記住了", "已熟悉", "完全掌握"];
  const languages = [
    ["english", "English"],
    ["japanese", "日本語"],
    ["german", "Deutsch"]
  ];

  function setupProgress() {
    if (!window.JLL.dom.qs("#stat-total-words")) {
      return;
    }
    const words = window.JLL.storage.getVocabulary();
    const history = window.JLL.storage.getReviewHistory();
    const activity = window.JLL.storage.getActivity();
    const state = window.JLL.storage.getState();
    const today = window.JLL.storage.todayIso();
    const weekStart = dateOffset(-6);
    const weekHistory = history.filter((entry) => entry.date >= weekStart);
    const correct = history.filter((entry) => entry.correct).length;
    const accuracy = history.length ? Math.round((correct / history.length) * 100) : 0;
    window.JLL.dom.setText(window.JLL.dom.qs("#stat-total-words"), words.length);
    window.JLL.dom.setText(window.JLL.dom.qs("#stat-due-today"), words.filter((word) => !word.nextReviewDate || word.nextReviewDate <= today).length);
    window.JLL.dom.setText(window.JLL.dom.qs("#stat-mastered"), words.filter((word) => word.familiarity === "完全掌握").length);
    window.JLL.dom.setText(window.JLL.dom.qs("#stat-week-reviews"), weekHistory.length);
    window.JLL.dom.setText(window.JLL.dom.qs("#stat-accuracy"), `${accuracy}%`);
    window.JLL.dom.setText(window.JLL.dom.qs("#stat-streak"), activity.streak || 1);
    renderRecentLessons(state);
    renderBars("#familiarity-bars", familiarityLevels.map((level) => [level, words.filter((word) => word.familiarity === level).length]), words.length);
    renderBars("#language-bars", languages.map(([code, label]) => [label, words.filter((word) => word.language === code).length]), words.length);
    renderWeakWords(words, history, today);
    renderCalendar(history);
  }

  function renderRecentLessons(state) {
    const container = window.JLL.dom.qs("#recent-lessons");
    container.replaceChildren();
    const lessons = state.recentlyViewedLessons || [];
    if (!lessons.length) {
      container.append(window.JLL.dom.createElement("p", { className: "muted", text: "尚未記錄最近學習教材。" }));
      return;
    }
    lessons.forEach((lesson) => {
      container.append(window.JLL.dom.createElement("a", {
        className: "pill",
        text: lesson.title || lesson.slug,
        attrs: { href: `reading.html?lesson=${encodeURIComponent(lesson.slug)}` }
      }));
    });
  }

  function renderBars(selector, rows, total) {
    const container = window.JLL.dom.qs(selector);
    container.replaceChildren();
    rows.forEach(([label, count]) => {
      const percent = total ? Math.round((count / total) * 100) : 0;
      const row = window.JLL.dom.createElement("div", { className: "bar-row" });
      const labelRow = window.JLL.dom.createElement("div", { className: "bar-label" });
      labelRow.append(window.JLL.dom.createElement("strong", { text: label }), window.JLL.dom.createElement("span", { text: `${count} (${percent}%)` }));
      const track = window.JLL.dom.createElement("div", { className: "bar-track" });
      track.append(window.JLL.dom.createElement("span", { className: "bar-fill", attrs: { style: `width:${percent}%` } }));
      row.append(labelRow, track);
      container.append(row);
    });
  }

  function renderWeakWords(words, history, today) {
    const container = window.JLL.dom.qs("#weak-words");
    container.replaceChildren();
    const wrongCounts = new Map();
    history.filter((entry) => !entry.correct).forEach((entry) => {
      wrongCounts.set(entry.wordId, (wrongCounts.get(entry.wordId) || 0) + 1);
    });
    const overdue = words.filter((word) => word.nextReviewDate && word.nextReviewDate < today);
    const stale = words.filter((word) => !word.lastReviewedAt && word.createdAt < today);
    const ranked = words
      .map((word) => ({ word, wrong: wrongCounts.get(word.id) || 0 }))
      .filter((item) => item.wrong > 0)
      .sort((a, b) => b.wrong - a.wrong)
      .slice(0, 5);
    const list = window.JLL.dom.createElement("ul");
    if (!ranked.length && !overdue.length && !stale.length) {
      container.append(window.JLL.dom.createElement("p", { className: "muted", text: "目前沒有足夠資料判斷弱點單字。" }));
      return;
    }
    ranked.forEach((item) => list.append(window.JLL.dom.createElement("li", { text: `${item.word.word}: 答錯 ${item.wrong} 次` })));
    overdue.slice(0, 5).forEach((word) => list.append(window.JLL.dom.createElement("li", { text: `${word.word}: 已逾期複習 (${word.nextReviewDate})` })));
    stale.slice(0, 5).forEach((word) => list.append(window.JLL.dom.createElement("li", { text: `${word.word}: 長期未複習` })));
    container.append(list);
  }

  function renderCalendar(history) {
    const container = window.JLL.dom.qs("#review-calendar");
    container.replaceChildren();
    for (let offset = -13; offset <= 0; offset += 1) {
      const date = dateOffset(offset);
      const entries = history.filter((entry) => entry.date === date);
      const correct = entries.filter((entry) => entry.correct).length;
      const accuracy = entries.length ? Math.round((correct / entries.length) * 100) : 0;
      const day = window.JLL.dom.createElement("div", { className: "calendar-day" });
      day.append(
        window.JLL.dom.createElement("strong", { text: date.slice(5) }),
        window.JLL.dom.createElement("p", { text: `${entries.length} 題` }),
        window.JLL.dom.createElement("p", { className: "muted", text: `答對率 ${accuracy}%` })
      );
      container.append(day);
    }
  }

  function dateOffset(offset) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  }

  document.addEventListener("DOMContentLoaded", setupProgress);
})();

