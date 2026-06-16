(function () {
  "use strict";

  let lessons = [];

  async function loadLessons() {
    const data = await window.JLL.data.fetchJson("data/lessons.json", null);
    lessons = Array.isArray(data) ? data.slice() : [];
    lessons.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || String(b.updatedAt).localeCompare(String(a.updatedAt)));
    return lessons;
  }

  function uniqueOptions(field) {
    return Array.from(new Set(lessons.map((lesson) => lesson[field]).filter(Boolean))).sort();
  }

  function fillSelect(select, values) {
    values.forEach((value) => {
      select.append(window.JLL.dom.createElement("option", { text: value, attrs: { value } }));
    });
  }

  function setupFilters() {
    fillSelect(window.JLL.dom.qs("#lesson-level"), uniqueOptions("level"));
    fillSelect(window.JLL.dom.qs("#lesson-topic"), uniqueOptions("topic"));
    const searchParam = new URLSearchParams(window.location.search).get("search");
    const searchInput = window.JLL.dom.qs("#lesson-search");
    if (searchParam && searchInput) {
      searchInput.value = searchParam;
    }
    ["#lesson-search", "#lesson-language", "#lesson-level", "#lesson-topic"].forEach((selector) => {
      const control = window.JLL.dom.qs(selector);
      if (control) {
        control.addEventListener("input", renderLessons);
        control.addEventListener("change", renderLessons);
      }
    });
  }

  function renderLessons() {
    const list = window.JLL.dom.qs("#lesson-list");
    if (!list) {
      return;
    }
    const search = window.JLL.dom.qs("#lesson-search").value.trim().toLowerCase();
    const language = window.JLL.dom.qs("#lesson-language").value;
    const level = window.JLL.dom.qs("#lesson-level").value;
    const topic = window.JLL.dom.qs("#lesson-topic").value;
    const filtered = lessons.filter((lesson) => {
      const haystack = [lesson.title, lesson.topic, lesson.shortDescription, lesson.level, ...(lesson.tags || [])].join(" ").toLowerCase();
      return (!search || haystack.includes(search)) &&
        (!language || lesson.language === language) &&
        (!level || lesson.level === level) &&
        (!topic || lesson.topic === topic);
    });
    list.replaceChildren();
    window.JLL.dom.setText(window.JLL.dom.qs("#lesson-count"), `${filtered.length} lessons`);
    if (!filtered.length) {
      list.append(window.JLL.dom.createElement("p", { className: "muted", text: "沒有符合條件的教材。可以放寬搜尋或清除篩選。" }));
      return;
    }
    filtered.forEach((lesson) => list.append(createLessonCard(lesson)));
  }

  function createLessonCard(lesson) {
    const card = window.JLL.dom.createElement("article", { className: `lesson-card${lesson.featured ? " is-featured" : ""}` });
    const body = window.JLL.dom.createElement("div");
    const meta = window.JLL.dom.createElement("p", {
      className: "muted",
      text: `${lesson.language} · ${lesson.level} · ${lesson.estimatedTime} · 最近更新 ${lesson.updatedAt}`
    });
    const tags = window.JLL.dom.createElement("ul", { className: "tag-list" });
    (lesson.tags || []).forEach((tag) => tags.append(window.JLL.dom.createElement("li", { text: tag })));
    body.append(
      window.JLL.dom.createElement("h3", { text: lesson.title }),
      window.JLL.dom.createElement("p", { text: lesson.shortDescription || lesson.topic }),
      meta,
      tags
    );
    const actions = window.JLL.dom.createElement("div", { className: "lesson-card-actions" });
    const lessonUrl = lesson.externalUrl || `reading.html?lesson=${encodeURIComponent(lesson.slug)}`;
    actions.append(
      window.JLL.dom.createElement("a", {
        className: "button",
        text: lesson.externalUrl ? "開啟完整互動版" : "開始互動閱讀",
        attrs: { href: lessonUrl }
      })
    );
    card.append(body, actions);
    return card;
  }

  async function setupLessonsPage() {
    if (!window.JLL.dom.qs("#lesson-list")) {
      return;
    }
    const loaded = await loadLessons();
    if (!loaded.length) {
      const error = window.JLL.dom.qs("#lesson-load-error");
      if (error) {
        error.hidden = false;
      }
    }
    setupFilters();
    renderLessons();
  }

  document.addEventListener("DOMContentLoaded", setupLessonsPage);

  window.JLL = window.JLL || {};
  window.JLL.lessons = { createLessonCard, loadLessons };
})();
