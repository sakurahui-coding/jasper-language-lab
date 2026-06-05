(function () {
  "use strict";

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function setText(element, text) {
    if (element) {
      element.textContent = text == null ? "" : String(text);
    }
  }

  function createElement(tag, options) {
    const element = document.createElement(tag);
    const config = options || {};
    if (config.className) {
      element.className = config.className;
    }
    if (config.text) {
      element.textContent = config.text;
    }
    if (config.attrs) {
      Object.entries(config.attrs).forEach(([key, value]) => {
        element.setAttribute(key, String(value));
      });
    }
    return element;
  }

  async function fetchJson(path, fallback) {
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`Could not load ${path}`, error);
      return fallback;
    }
  }

  function getYouTubeId(input) {
    const value = String(input || "").trim();
    if (!value) {
      return "";
    }
    try {
      const url = new URL(value);
      if (url.hostname.includes("youtu.be")) {
        return sanitizeYouTubeId(url.pathname.slice(1));
      }
      if (url.hostname.includes("youtube.com")) {
        return sanitizeYouTubeId(url.searchParams.get("v") || url.pathname.split("/").pop());
      }
    } catch (error) {
      return sanitizeYouTubeId(value);
    }
    return "";
  }

  function sanitizeYouTubeId(id) {
    const match = String(id || "").match(/^[a-zA-Z0-9_-]{11}$/);
    return match ? match[0] : "";
  }

  function parseTimedLines(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("|");
        if (parts.length >= 2) {
          return { time: parts[0].trim(), text: parts.slice(1).join("|").trim() };
        }
        return { time: "", text: line };
      })
      .filter((item) => item.text);
  }

  function setupNavigation() {
    const toggle = qs(".nav-toggle");
    const nav = qs(".nav-links");
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  async function setupHome() {
    if (!qs("[data-stat='dueWords']")) {
      return;
    }
    updateGreeting();
    const words = window.JLL.storage.getVocabulary();
    const today = window.JLL.storage.todayIso();
    const due = words.filter((word) => !word.nextReviewDate || word.nextReviewDate <= today).length;
    const completedPieces = Math.min(3, Number(Boolean(words.length)) + Number(Boolean(due === 0)) + 1);
    const activity = window.JLL.storage.getActivity();
    setText(qs("[data-stat='todayProgress']"), `${Math.round((completedPieces / 3) * 100)}%`);
    setText(qs("[data-stat='dueWords']"), due);
    setText(qs("[data-stat='streak']"), activity.streak || 1);
    const lessons = await fetchJson("data/lessons.json", []);
    renderHomeLessons(Array.isArray(lessons) ? lessons : []);
  }

  function updateGreeting(date) {
    const title = qs("#home-title");
    if (!title) {
      return;
    }
    const hour = (date || new Date()).getHours();
    let greeting = "Good evening";
    if (hour >= 5 && hour < 12) {
      greeting = "Good morning";
    } else if (hour >= 12 && hour < 18) {
      greeting = "Good afternoon";
    }
    setText(title, greeting);
  }

  function renderHomeLessons(lessons) {
    const recentCard = qs("#recent-lesson-card");
    const featuredCard = qs("#featured-lessons-card");
    if (!recentCard || !featuredCard) {
      return;
    }
    const state = window.JLL.storage.getState();
    const last = state.lastOpenedLesson || lessons[0];
    if (last) {
      recentCard.replaceChildren(
        createElement("h2", { text: "最近閱讀文章" }),
        createElement("p", { text: last.title || "What Never Changes in a Changing World" }),
        createElement("p", { className: "muted", text: "進度是依最後選取的段落估算，不代表精準字數位置。" }),
        createElement("a", {
          className: "button secondary",
          text: "繼續閱讀",
          attrs: { href: `reading.html?lesson=${encodeURIComponent(last.slug || "what-never-changes")}` }
        })
      );
    }
    const featured = lessons.filter((lesson) => lesson.featured).slice(0, 3);
    featuredCard.replaceChildren(createElement("h2", { text: "推薦教材" }));
    if (!featured.length) {
      featuredCard.append(createElement("p", { className: "muted", text: "教材索引暫時無法載入，請稍後再試。" }));
    } else {
      featured.forEach((lesson) => {
        featuredCard.append(createElement("a", {
          className: "pill",
          text: lesson.title,
          attrs: { href: `reading.html?lesson=${encodeURIComponent(lesson.slug)}` }
        }));
      });
    }
    featuredCard.append(createElement("p", { text: "" }), createElement("a", { className: "button secondary", text: "查看全部教材", attrs: { href: "lessons.html" } }));
  }

  function setupVideoPage(kind) {
    const isSong = kind === "song";
    const urlInput = qs(isSong ? "#song-url" : "#youtube-url");
    const frame = qs(isSong ? "#song-frame" : "#youtube-frame");
    const message = qs(isSong ? "#song-message" : "#video-message");
    const lineInput = qs(isSong ? "#song-lines" : "#video-lines");
    const list = qs(isSong ? "#song-sentence-list" : "#video-sentence-list");
    if (!urlInput || !frame) {
      return;
    }

    document.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) {
        return;
      }
      const action = button.dataset.action;
      if ((action === "load-video" && !isSong) || (action === "load-song" && isSong)) {
        const id = getYouTubeId(urlInput.value);
        if (!id) {
          setText(message, "請輸入合法的 YouTube 影片網址或 11 碼影片 ID。");
          return;
        }
        frame.src = `https://www.youtube.com/embed/${id}`;
        setText(message, "已使用 YouTube 官方 embed 載入。");
      }
      if ((action === "parse-video-lines" && !isSong) || (action === "parse-song-lines" && isSong)) {
        renderSentenceList(list, parseTimedLines(lineInput.value), isSong);
      }
      if (action === "save-ab") {
        setText(message, "已記錄 AB Repeat prototype 區間。第一版不直接控制播放器。");
      }
      if (action === "shadowing-note" || action === "song-recording") {
        setText(message, "已建立練習入口提示。實際錄音功能可在下一版加入。");
      }
    });
  }

  function renderSentenceList(list, lines, isSong) {
    if (!list) {
      return;
    }
    list.replaceChildren();
    if (!lines.length) {
      const empty = createElement("li", { className: "sentence-item", text: "尚未建立句子。" });
      list.append(empty);
      return;
    }
    lines.forEach((line) => {
      const item = createElement("li", { className: "sentence-item" });
      const sentence = createElement("strong", { text: line.text });
      const time = createElement("span", { className: "muted", text: line.time ? `時間點：${line.time} 秒` : "未設定時間點" });
      const actions = createElement("div", { className: "reader-controls" });
      const jump = createElement("button", { className: "button secondary", text: "跳至時間 prototype", attrs: { type: "button", "aria-label": "跳至句子時間點原型" } });
      const save = createElement("button", { className: "button secondary", text: isSong ? "收藏佳句" : "收藏句子", attrs: { type: "button", "aria-label": isSong ? "收藏歌曲佳句" : "收藏影片句子" } });
      save.addEventListener("click", () => {
        window.JLL.storage.upsertVocabulary({
          id: `saved-${Date.now()}`,
          word: line.text.slice(0, 32),
          pronunciation: "",
          partOfSpeech: "sentence",
          chineseDefinition: "使用者收藏的學習句",
          englishDefinition: line.text,
          example: line.text,
          sourceSentence: line.text,
          sourceTitle: isSong ? "Song practice" : "YouTube practice",
          sourceLessonId: isSong ? "song-practice" : "video-practice",
          sourceLessonSlug: isSong ? "song-practice" : "video-practice",
          language: "english",
          tags: [isSong ? "song" : "video"],
          familiarity: "不認識",
          createdAt: window.JLL.storage.todayIso(),
          lastReviewedAt: "",
          nextReviewDate: window.JLL.storage.addDays(1)
        });
        save.textContent = "已收藏";
      });
      actions.append(jump, save);
      item.append(sentence, time, actions);
      list.append(item);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
    setupHome();
    setupVideoPage("video");
    setupVideoPage("song");
  });

  window.JLL = window.JLL || {};
  window.JLL.dom = { createElement, qs, qsa, setText };
  window.JLL.data = { fetchJson };
  window.JLL.home = { updateGreeting };
  window.JLL.youtube = { getYouTubeId, parseTimedLines };
})();
