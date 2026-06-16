(function () {
  "use strict";

  const familiarityLevels = ["不認識", "有印象", "快記住了", "已熟悉", "完全掌握"];
  let lesson = null;
  let lessonSummary = null;
  let selectedWord = null;
  let activeSentenceIndex = 0;
  let readerFontSize = 1.08;

  function loadSeedVocabulary() {
    return window.JLL.data.fetchJson("data/sample-vocabulary.json", []);
  }

  async function ensureVocabularySeeded() {
    const current = window.JLL.storage.getVocabulary();
    if (current.length) {
      return current;
    }
    const sample = await loadSeedVocabulary();
    window.JLL.storage.saveVocabulary(sample);
    return sample;
  }

  async function setupReadingPage() {
    const articleText = window.JLL.dom.qs("#article-text");
    if (!articleText) {
      return;
    }
    const result = await loadRequestedLesson();
    if (!result.ok) {
      renderLessonError(result.message);
      return;
    }
    lesson = result.lesson;
    lessonSummary = result.summary;
    renderLesson();
    if (!window.JLL.speech.isSupported()) {
      const warning = window.JLL.dom.qs("#speech-warning");
      if (warning) {
        warning.hidden = false;
      }
    }
  }

  async function loadRequestedLesson() {
    const params = new URLSearchParams(window.location.search);
    const requestedSlug = params.get("lesson") || "europe-dam-removal";
    if (!/^[a-z0-9-]+$/.test(requestedSlug)) {
      return { ok: false, message: "教材網址格式不正確。" };
    }
    const index = await window.JLL.data.fetchJson("data/lessons.json", null);
    if (!Array.isArray(index)) {
      return { ok: false, message: "教材索引載入失敗，請稍後再試。" };
    }
    const summary = index.find((item) => item.slug === requestedSlug);
    if (!summary) {
      return { ok: false, message: "找不到教材。" };
    }
    const dataFile = String(summary.dataFile || "");
    if (!dataFile || dataFile.startsWith("/") || dataFile.includes("..")) {
      return { ok: false, message: "教材資料路徑不合法。" };
    }
    const loaded = await window.JLL.data.fetchJson(dataFile, null);
    if (!loaded) {
      return { ok: false, message: "教材 JSON 載入失敗，頁面無法顯示這篇教材。" };
    }
    return { ok: true, lesson: loaded, summary };
  }

  function renderLessonError(message) {
    window.JLL.dom.setText(window.JLL.dom.qs("#lesson-title"), message);
    const meta = window.JLL.dom.qs("#lesson-meta");
    const goals = window.JLL.dom.qs("#learning-goals");
    const text = window.JLL.dom.qs("#article-text");
    meta.replaceChildren();
    goals.replaceChildren();
    text.replaceChildren(
      window.JLL.dom.createElement("p", { className: "notice", text: "請回到教材列表重新選擇，或檢查網址中的 lesson 參數。" }),
      window.JLL.dom.createElement("a", { className: "button", text: "返回教材列表", attrs: { href: "lessons.html" } })
    );
  }

  function renderLesson() {
    window.JLL.dom.setText(window.JLL.dom.qs("#lesson-title"), lesson.title);
    document.title = `${lesson.title} | Jasper Language Lab`;
    const meta = window.JLL.dom.qs("#lesson-meta");
    meta.replaceChildren();
    [lesson.level, lesson.estimatedTime, lesson.topic].forEach((item) => {
      meta.append(window.JLL.dom.createElement("span", { className: "pill", text: item }));
    });

    const goals = window.JLL.dom.qs("#learning-goals");
    goals.replaceChildren();
    lesson.learningGoals.forEach((goal) => goals.append(window.JLL.dom.createElement("li", { text: goal })));

    const articleText = window.JLL.dom.qs("#article-text");
    articleText.replaceChildren();
    lesson.paragraphs.forEach((paragraph, index) => {
      const section = window.JLL.dom.createElement("section", { className: `sentence${index === activeSentenceIndex ? " is-active" : ""}` });
      section.dataset.sentenceIndex = String(index);
      const english = window.JLL.dom.createElement("p");
      english.append(...wordNodes(paragraph.english));
      const chinese = window.JLL.dom.createElement("p", { className: "translation muted", text: paragraph.chinese });
      chinese.hidden = true;
      section.append(english, chinese);
      articleText.append(section);
    });
    renderLessonDetails();
    window.JLL.storage.setLessonProgress(lesson, activeSentenceIndex, lesson.paragraphs.length);
  }

  function renderLessonDetails() {
    const details = window.JLL.dom.qs("#lesson-details");
    if (!details) {
      return;
    }
    details.replaceChildren();
    details.append(window.JLL.dom.createElement("h2", { text: "Phrases, Grammar, Sentences, Practice" }));
    appendPhraseSection(details, lesson.phrases || []);
    appendGrammarSection(details, lesson.grammar || []);
    appendSimpleSection(details, "Important Sentences", (lesson.importantSentences || []).map((item) => `${item.sentence} ${item.note}`));
    appendSimpleSection(details, "Practice", (lesson.practice || []).map((item) => {
      const options = Array.isArray(item.options) ? ` Options: ${item.options.join(" / ")}` : "";
      return `${item.question}${options}`;
    }));
    appendSimpleSection(details, "Answer Key", (lesson.answerKey || []).map((item) => `${item.question} Answer: ${item.answer}`));
    appendSourceSection(details, lesson.source);
  }

  function appendSimpleSection(parent, title, rows) {
    if (!rows.length) {
      return;
    }
    parent.append(window.JLL.dom.createElement("h3", { text: title }));
    const list = window.JLL.dom.createElement("ul");
    rows.forEach((row) => list.append(window.JLL.dom.createElement("li", { text: row })));
    parent.append(list);
  }

  function appendPhraseSection(parent, rows) {
    if (!rows.length) {
      return;
    }
    parent.append(window.JLL.dom.createElement("h3", { text: "Phrases" }));
    const list = window.JLL.dom.createElement("ul", { className: "lesson-detail-list" });
    rows.forEach((row) => {
      const item = window.JLL.dom.createElement("li");
      item.append(
        window.JLL.dom.createElement("strong", { className: "detail-highlight phrase-highlight", text: row.phrase }),
        document.createTextNode(`: ${row.chineseDefinition}`),
        window.JLL.dom.createElement("span", { className: "detail-example", text: row.example })
      );
      list.append(item);
    });
    parent.append(list);
  }

  function appendGrammarSection(parent, rows) {
    if (!rows.length) {
      return;
    }
    parent.append(window.JLL.dom.createElement("h3", { text: "Grammar" }));
    const list = window.JLL.dom.createElement("ul", { className: "lesson-detail-list" });
    rows.forEach((row) => {
      const item = window.JLL.dom.createElement("li");
      item.append(
        window.JLL.dom.createElement("strong", { className: "detail-highlight grammar-highlight", text: row.point }),
        document.createTextNode(`: ${row.explanation}`),
        window.JLL.dom.createElement("span", { className: "detail-example", text: `Example: ${row.example}` })
      );
      list.append(item);
    });
    parent.append(list);
  }

  function appendSourceSection(parent, source) {
    if (!source || !source.title) {
      return;
    }
    parent.append(window.JLL.dom.createElement("h3", { text: "Sources" }));
    const list = window.JLL.dom.createElement("ul");
    const item = window.JLL.dom.createElement("li");
    item.append(document.createTextNode(`${source.title}${source.author ? `, ${source.author}` : ""}${source.publishedAt ? `, ${source.publishedAt}` : ""}. `));
    if (source.url) {
      item.append(window.JLL.dom.createElement("a", {
        text: "Open source",
        attrs: { href: source.url, target: "_blank", rel: "noopener noreferrer" }
      }));
    }
    if (source.note) {
      item.append(document.createTextNode(` ${source.note}`));
    }
    list.append(item);
    parent.append(list);
  }

  function wordNodes(text) {
    const vocabMap = new Map();
    lesson.vocabulary.forEach((item) => {
      vocabMap.set(item.word.toLowerCase(), item);
      (item.aliases || []).forEach((alias) => {
        vocabMap.set(String(alias).toLowerCase(), item);
      });
    });
    const fragments = [];
    String(text).split(/(\b[\w'-]+\b)/).forEach((part) => {
      const key = part.toLowerCase().replace(/s$/, "");
      const item = vocabMap.get(part.toLowerCase()) || vocabMap.get(key);
      if (item) {
        const button = window.JLL.dom.createElement("button", {
          className: "word-button",
          text: part,
          attrs: { type: "button", "aria-label": `顯示 ${item.word} 單字卡` }
        });
        button.addEventListener("click", () => showWordCard(item));
        fragments.push(button);
      } else {
        fragments.push(document.createTextNode(part));
      }
    });
    return fragments;
  }

  function showWordCard(word) {
    selectedWord = word;
    const card = window.JLL.dom.qs("#word-card");
    card.hidden = false;
    window.JLL.dom.setText(window.JLL.dom.qs("#word-card-word"), word.word);
    window.JLL.dom.setText(window.JLL.dom.qs("#word-card-pronunciation"), word.pronunciation);
    window.JLL.dom.setText(window.JLL.dom.qs("#word-card-pos"), word.partOfSpeech);
    window.JLL.dom.setText(window.JLL.dom.qs("#word-card-zh"), word.chineseDefinition);
    window.JLL.dom.setText(window.JLL.dom.qs("#word-card-en"), word.englishDefinition);
    window.JLL.dom.setText(window.JLL.dom.qs("#word-card-example"), word.example || word.sourceSentence);
  }

  function activeSentenceText() {
    if (!lesson || !lesson.paragraphs[activeSentenceIndex]) {
      return "";
    }
    return lesson.paragraphs[activeSentenceIndex].english;
  }

  function updateActiveSentence(direction) {
    if (!lesson) {
      return;
    }
    activeSentenceIndex = Math.max(0, Math.min(lesson.paragraphs.length - 1, activeSentenceIndex + direction));
    window.JLL.dom.qsa(".sentence").forEach((sentence, index) => {
      sentence.classList.toggle("is-active", index === activeSentenceIndex);
    });
    window.JLL.storage.setLessonProgress(lesson, activeSentenceIndex, lesson.paragraphs.length);
  }

  function setupReadingActions() {
    if (!window.JLL.dom.qs("#article-text")) {
      return;
    }
    document.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) {
        return;
      }
      const action = button.dataset.action;
      if (action === "toggle-translation") {
        const translations = window.JLL.dom.qsa(".translation");
        const shouldShow = translations.some((item) => item.hidden);
        translations.forEach((item) => {
          item.hidden = !shouldShow;
        });
        button.textContent = shouldShow ? "隱藏中文" : "顯示中文";
      }
      if (action === "increase-font" || action === "decrease-font") {
        readerFontSize += action === "increase-font" ? 0.08 : -0.08;
        readerFontSize = Math.max(0.95, Math.min(1.4, readerFontSize));
        document.documentElement.style.setProperty("--reader-font-size", `${readerFontSize}rem`);
      }
      if (action === "previous-sentence") {
        updateActiveSentence(-1);
      }
      if (action === "next-sentence") {
        updateActiveSentence(1);
      }
      if (action === "speak-sentence") {
        window.JLL.speech.speak(activeSentenceText(), "en-US");
      }
      if (action === "speak-word" && selectedWord) {
        window.JLL.speech.speak(selectedWord.word, "en-US");
      }
      if (action === "save-word" && selectedWord) {
        window.JLL.storage.upsertVocabulary({
          ...selectedWord,
          sourceLessonId: lesson.id,
          sourceLessonSlug: lesson.slug,
          sourceTitle: lesson.title,
          sourceSentence: selectedWord.sourceSentence || activeSentenceText()
        });
        button.textContent = "已收藏";
      }
    });
  }

  function renderVocabularyListPublic() {
    renderVocabularyList();
  }

  async function setupVocabularyPage() {
    const list = window.JLL.dom.qs("#vocab-list");
    if (!list) {
      return;
    }
    await ensureVocabularySeeded();
    renderVocabularyList();
    ["#search-input", "#language-filter", "#pos-filter", "#familiarity-filter"].forEach((selector) => {
      const control = window.JLL.dom.qs(selector);
      control.addEventListener("input", renderVocabularyList);
      control.addEventListener("change", renderVocabularyList);
    });
  }

  function renderVocabularyList() {
    const list = window.JLL.dom.qs("#vocab-list");
    const count = window.JLL.dom.qs("#vocab-count");
    const search = window.JLL.dom.qs("#search-input").value.trim().toLowerCase();
    const language = window.JLL.dom.qs("#language-filter").value;
    const pos = window.JLL.dom.qs("#pos-filter").value;
    const familiarity = window.JLL.dom.qs("#familiarity-filter").value;
    const words = window.JLL.storage.getVocabulary().filter((word) => {
      const haystack = [word.word, word.chineseDefinition, word.englishDefinition, word.sourceTitle, ...(word.tags || [])].join(" ").toLowerCase();
      return (!search || haystack.includes(search)) &&
        (!language || word.language === language) &&
        (!pos || word.partOfSpeech === pos) &&
        (!familiarity || word.familiarity === familiarity);
    });
    list.replaceChildren();
    window.JLL.dom.setText(count, `${words.length} words`);
    if (!words.length) {
      list.append(window.JLL.dom.createElement("p", { className: "muted", text: "目前沒有符合條件的單字。" }));
      return;
    }
    words.forEach((word) => list.append(createVocabularyItem(word)));
  }

  function createVocabularyItem(word) {
    const item = window.JLL.dom.createElement("article", { className: "vocab-item" });
    const titleRow = window.JLL.dom.createElement("div", { className: "vocab-title-row" });
    const titleWrap = window.JLL.dom.createElement("div");
    titleWrap.append(
      window.JLL.dom.createElement("h3", { text: word.word }),
      window.JLL.dom.createElement("p", { className: "muted", text: `${word.pronunciation || "No IPA"} · ${word.partOfSpeech}` })
    );
    const speak = window.JLL.dom.createElement("button", { className: "button secondary", text: "發音", attrs: { type: "button", "aria-label": `朗讀 ${word.word}` } });
    speak.addEventListener("click", () => window.JLL.speech.speak(word.word, "en-US"));
    titleRow.append(titleWrap, speak);

    const defs = window.JLL.dom.createElement("p", { text: `${word.chineseDefinition} / ${word.englishDefinition}` });
    const source = window.JLL.dom.createElement("p", { className: "muted", text: `來源：${word.sourceTitle || "manual"} · 收藏日期：${word.createdAt || ""} · 下次複習：${word.nextReviewDate || ""}` });
    const select = window.JLL.dom.createElement("select", { className: "select", attrs: { "aria-label": `更新 ${word.word} 熟悉程度` } });
    familiarityLevels.forEach((level) => {
      const option = window.JLL.dom.createElement("option", { text: level, attrs: { value: level } });
      option.selected = word.familiarity === level;
      select.append(option);
    });
    select.addEventListener("change", () => {
      window.JLL.storage.upsertVocabulary({ ...word, familiarity: select.value });
      renderVocabularyList();
    });
    const deleteButton = window.JLL.dom.createElement("button", { className: "button danger", text: "刪除收藏", attrs: { type: "button", "aria-label": `刪除 ${word.word} 收藏` } });
    deleteButton.addEventListener("click", () => {
      if (window.confirm(`確定要刪除「${word.word}」嗎？`)) {
        window.JLL.storage.removeVocabulary(word.id);
        renderVocabularyList();
      }
    });
    const tags = window.JLL.dom.createElement("ul", { className: "tag-list" });
    (word.tags || []).forEach((tag) => tags.append(window.JLL.dom.createElement("li", { text: tag })));
    const controls = window.JLL.dom.createElement("div", { className: "reader-controls" });
    controls.append(select, deleteButton);
    item.append(titleRow, defs, source, tags, controls);
    return item;
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupReadingPage();
    setupReadingActions();
    setupVocabularyPage();
  });

  window.JLL = window.JLL || {};
  window.JLL.vocabulary = { ensureVocabularySeeded, renderVocabularyList: renderVocabularyListPublic };
})();
