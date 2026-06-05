(function () {
  "use strict";

  const schedule = {
    wrong: { days: 1, familiarity: "不認識" },
    hard: { days: 2, familiarity: "有印象" },
    normal: { days: 4, familiarity: "快記住了" },
    easy: { days: 7, familiarity: "已熟悉" },
    mastered: { days: 14, familiarity: "完全掌握" }
  };
  const modes = ["看單字選意思", "看意思選單字"];
  let words = [];
  let currentIndex = 0;
  let currentMode = 0;
  let correct = 0;
  let incorrect = 0;
  let flipped = false;

  async function setupReview() {
    if (!window.JLL.dom.qs("#quiz-prompt")) {
      return;
    }
    words = await getReviewWords();
    renderReview();
    setupReviewActions();
  }

  async function getReviewWords() {
    let saved = window.JLL.storage.getVocabulary();
    if (!saved.length) {
      const sample = await window.JLL.data.fetchJson("data/sample-vocabulary.json", []);
      window.JLL.storage.saveVocabulary(sample);
      saved = sample;
    }
    const today = window.JLL.storage.todayIso();
    const due = saved.filter((word) => !word.nextReviewDate || word.nextReviewDate <= today);
    return due.length ? due : saved.slice(0, 5);
  }

  function renderReview() {
    window.JLL.dom.setText(window.JLL.dom.qs("#review-progress"), `${words.length ? currentIndex + 1 : 0} / ${words.length}`);
    window.JLL.dom.setText(window.JLL.dom.qs("#review-score"), `答對 ${correct} · 答錯 ${incorrect}`);
    if (!words.length) {
      window.JLL.dom.setText(window.JLL.dom.qs("#quiz-prompt"), "目前沒有待複習單字。");
      return;
    }
    const word = words[currentIndex];
    currentMode = currentIndex % modes.length;
    window.JLL.dom.setText(window.JLL.dom.qs("#quiz-title"), modes[currentMode]);
    window.JLL.dom.setText(window.JLL.dom.qs("#quiz-mode-label"), currentMode === 0 ? "請選出正確中文意思。" : "請選出對應英文單字。");
    window.JLL.dom.setText(window.JLL.dom.qs("#quiz-prompt"), currentMode === 0 ? word.word : word.chineseDefinition);
    renderOptions(word);
    renderFlashCard(word);
    renderBlankQuestion(word);
  }

  function renderOptions(word) {
    const options = window.JLL.dom.qs("#quiz-options");
    options.replaceChildren();
    const pool = words.length >= 4 ? words : words.concat(words);
    const correctAnswer = currentMode === 0 ? word.chineseDefinition : word.word;
    const distractors = pool
      .filter((item) => item.id !== word.id)
      .map((item) => currentMode === 0 ? item.chineseDefinition : item.word)
      .filter(Boolean)
      .slice(0, 3);
    const answers = shuffle([correctAnswer, ...distractors]).slice(0, 4);
    answers.forEach((answer) => {
      const button = window.JLL.dom.createElement("button", { className: "button secondary", text: answer, attrs: { type: "button", "aria-label": `選擇答案 ${answer}` } });
      button.addEventListener("click", () => {
        const isCorrect = answer === correctAnswer;
        correct += isCorrect ? 1 : 0;
        incorrect += isCorrect ? 0 : 1;
        window.JLL.storage.addReviewHistory({
          wordId: word.id,
          word: word.word,
          language: word.language,
          sourceLessonId: word.sourceLessonId,
          correct: isCorrect,
          mode: modes[currentMode]
        });
        window.JLL.dom.setText(window.JLL.dom.qs("#quiz-result"), isCorrect ? "答對了。選一個熟悉程度安排下次複習。" : `答錯了。正確答案是：${correctAnswer}`);
        window.JLL.dom.setText(window.JLL.dom.qs("#review-score"), `答對 ${correct} · 答錯 ${incorrect}`);
      });
      options.append(button);
    });
  }

  function renderFlashCard(word) {
    flipped = false;
    window.JLL.dom.setText(window.JLL.dom.qs("#flash-front"), word.word);
    window.JLL.dom.setText(window.JLL.dom.qs("#flash-back"), `${word.chineseDefinition} · ${word.example}`);
    window.JLL.dom.qs("#flash-back").hidden = true;
  }

  function renderBlankQuestion(word) {
    const blank = word.example.replace(new RegExp(word.word, "i"), "____");
    window.JLL.dom.setText(window.JLL.dom.qs("#blank-question"), blank);
    window.JLL.dom.qs("#blank-answer").value = "";
  }

  function setupReviewActions() {
    document.addEventListener("click", (event) => {
      const ratingButton = event.target.closest("[data-review-rating]");
      if (ratingButton && words.length) {
        applyRating(ratingButton.dataset.reviewRating);
      }
    });
    window.JLL.dom.qs("#flip-card").addEventListener("click", flipCard);
    window.JLL.dom.qs("#flash-card").addEventListener("click", flipCard);
    window.JLL.dom.qs("#flash-card").addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        flipCard();
      }
    });
    window.JLL.dom.qs("#next-card").addEventListener("click", nextCard);
    window.JLL.dom.qs("#check-blank").addEventListener("click", checkBlank);
  }

  function flipCard() {
    flipped = !flipped;
    window.JLL.dom.qs("#flash-back").hidden = !flipped;
  }

  function checkBlank() {
    if (!words.length) {
      return;
    }
    const answer = window.JLL.dom.qs("#blank-answer").value.trim().toLowerCase();
    const expected = words[currentIndex].word.toLowerCase();
    const isCorrect = answer === expected;
    correct += isCorrect ? 1 : 0;
    incorrect += isCorrect ? 0 : 1;
    window.JLL.storage.addReviewHistory({
      wordId: words[currentIndex].id,
      word: words[currentIndex].word,
      language: words[currentIndex].language,
      sourceLessonId: words[currentIndex].sourceLessonId,
      correct: isCorrect,
      mode: "例句填空"
    });
    window.JLL.dom.setText(window.JLL.dom.qs("#quiz-result"), isCorrect ? "填空答對了。" : `填空答案是：${words[currentIndex].word}`);
    window.JLL.dom.setText(window.JLL.dom.qs("#review-score"), `答對 ${correct} · 答錯 ${incorrect}`);
  }

  function applyRating(rating) {
    const word = words[currentIndex];
    const plan = schedule[rating] || schedule.normal;
    window.JLL.storage.upsertVocabulary({
      ...word,
      familiarity: plan.familiarity,
      lastReviewedAt: window.JLL.storage.todayIso(),
      nextReviewDate: window.JLL.storage.addDays(plan.days)
    });
    window.JLL.storage.addReviewHistory({
      wordId: word.id,
      word: word.word,
      language: word.language,
      sourceLessonId: word.sourceLessonId,
      correct: rating !== "wrong",
      rating,
      mode: "熟悉程度"
    });
    const activity = window.JLL.storage.getActivity();
    window.JLL.storage.saveActivity({
      ...activity,
      correct: (activity.correct || 0) + correct,
      incorrect: (activity.incorrect || 0) + incorrect,
      lastStudyDate: window.JLL.storage.todayIso(),
      streak: activity.streak || 1
    });
    nextCard();
  }

  function nextCard() {
    if (!words.length) {
      return;
    }
    currentIndex = (currentIndex + 1) % words.length;
    window.JLL.dom.setText(window.JLL.dom.qs("#quiz-result"), "選一個答案開始。");
    renderReview();
  }

  function shuffle(items) {
    return items
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((item) => item.value);
  }

  document.addEventListener("DOMContentLoaded", setupReview);
})();
