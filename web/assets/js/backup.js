(function () {
  "use strict";

  const maxFileSize = 1024 * 1024;
  let pendingImport = null;

  function setupBackup() {
    if (!window.JLL.dom.qs("#export-vocabulary")) {
      return;
    }
    updateBackupMeta();
    window.JLL.dom.qs("#export-vocabulary").addEventListener("click", exportVocabulary);
    window.JLL.dom.qs("#import-vocabulary-file").addEventListener("change", handleImportFile);
    window.JLL.dom.qs("#clear-vocabulary").addEventListener("click", clearVocabulary);
  }

  function updateBackupMeta() {
    const state = window.JLL.storage.getState();
    window.JLL.dom.setText(window.JLL.dom.qs("#last-backup"), `最後備份：${state.lastBackupAt || "尚未匯出"}`);
  }

  function exportVocabulary() {
    const payload = {
      schemaVersion: 2,
      application: "Jasper Language Lab",
      exportedAt: new Date().toISOString(),
      vocabulary: window.JLL.storage.getVocabulary(),
      reviewHistory: window.JLL.storage.getReviewHistory(),
      settings: window.JLL.storage.getState().settings || {}
    };
    const date = window.JLL.storage.todayIso();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `jasper-language-lab-vocabulary-${date}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    window.JLL.storage.saveState({ lastBackupAt: payload.exportedAt });
    updateBackupMeta();
    showMessage("已建立 JSON 備份檔。");
  }

  function handleImportFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }
    if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") {
      showMessage("請選擇 JSON 檔案。");
      return;
    }
    if (file.size > maxFileSize) {
      showMessage("檔案太大，請選擇 1MB 以下的備份檔。");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => parseImport(String(reader.result || ""));
    reader.onerror = () => showMessage("讀取檔案失敗，請重新選擇。");
    reader.readAsText(file);
  }

  function parseImport(text) {
    let payload = null;
    try {
      payload = JSON.parse(text);
    } catch (error) {
      showMessage("JSON 格式錯誤，無法解析。");
      return;
    }
    const validation = window.JLL.schema.validateExportPayload(payload);
    if (!validation.ok) {
      showMessage(validation.message);
      return;
    }
    const analysis = analyzePayload(payload);
    if (!analysis.ok) {
      showMessage(analysis.message);
      return;
    }
    pendingImport = analysis.summary;
    renderImportPreview(pendingImport);
  }

  function analyzePayload(payload) {
    const validation = window.JLL.schema.validateExportPayload(payload);
    if (!validation.ok) {
      return { ok: false, message: validation.message };
    }
    const valid = window.JLL.schema.validateVocabularyList(payload.vocabulary);
    const existing = window.JLL.storage.getVocabulary();
    const existingMap = new Map(existing.map((word) => [window.JLL.schema.vocabularyKey(word), word]));
    const incomingMap = new Map();
    const conflicts = [];
    let duplicates = 0;
    valid.words.forEach((word) => {
      const key = window.JLL.schema.vocabularyKey(word);
      if (incomingMap.has(key)) {
        duplicates += 1;
        return;
      }
      incomingMap.set(key, word);
      const current = existingMap.get(key);
      if (current && JSON.stringify(current) === JSON.stringify(word)) {
        duplicates += 1;
      } else if (current) {
        conflicts.push(word);
      }
    });
    const incoming = Array.from(incomingMap.values());
    const added = incoming.filter((word) => !existingMap.has(window.JLL.schema.vocabularyKey(word))).length;
    return {
      ok: true,
      summary: {
      payload,
      incoming,
      added,
      duplicates,
      conflicts: conflicts.length,
      invalid: valid.invalid.length
      }
    };
  }

  function renderImportPreview(summary) {
    const preview = window.JLL.dom.qs("#import-preview");
    preview.hidden = false;
    preview.replaceChildren();
    preview.append(
      window.JLL.dom.createElement("h3", { text: "匯入預覽" }),
      window.JLL.dom.createElement("p", { text: `新增 ${summary.added} · 重複 ${summary.duplicates} · 衝突 ${summary.conflicts} · 無效 ${summary.invalid}` })
    );
    const controls = window.JLL.dom.createElement("div", { className: "reader-controls" });
    const merge = window.JLL.dom.createElement("button", { className: "button", text: "合併", attrs: { type: "button", "aria-label": "合併匯入單字" } });
    const replace = window.JLL.dom.createElement("button", { className: "button danger", text: "覆蓋", attrs: { type: "button", "aria-label": "覆蓋現有單字資料" } });
    const cancel = window.JLL.dom.createElement("button", { className: "button secondary", text: "取消", attrs: { type: "button", "aria-label": "取消匯入" } });
    merge.addEventListener("click", () => applyImport("merge"));
    replace.addEventListener("click", () => applyImport("replace"));
    cancel.addEventListener("click", () => {
      pendingImport = null;
      showMessage("已取消匯入。");
    });
    controls.append(merge, replace, cancel);
    preview.append(controls);
  }

  function applyImport(mode) {
    if (!pendingImport) {
      showMessage("沒有待匯入資料。");
      return;
    }
    if (mode === "replace" && !window.confirm("覆蓋會取代所有現有單字。請先確認已匯出備份。確定覆蓋嗎？")) {
      return;
    }
    const existing = mode === "replace" ? [] : window.JLL.storage.getVocabulary();
    const map = new Map(existing.map((word) => [window.JLL.schema.vocabularyKey(word), word]));
    pendingImport.incoming.forEach((word) => {
      map.set(window.JLL.schema.vocabularyKey(word), word);
    });
    window.JLL.storage.saveVocabulary(Array.from(map.values()));
    if (Array.isArray(pendingImport.payload.reviewHistory)) {
      const state = window.JLL.storage.getState();
      window.JLL.storage.saveState({
        reviewHistory: mode === "replace" ? pendingImport.payload.reviewHistory : (state.reviewHistory || []).concat(pendingImport.payload.reviewHistory).slice(-1000),
        settings: pendingImport.payload.settings || state.settings || {}
      });
    }
    const message = mode === "replace" ? "已覆蓋並匯入資料。" : "已合併匯入資料。";
    pendingImport = null;
    showMessage(message);
    if (window.JLL.vocabulary && window.JLL.vocabulary.renderVocabularyList) {
      window.JLL.vocabulary.renderVocabularyList();
    }
  }

  function clearVocabulary() {
    const warning = "清除會刪除目前瀏覽器中的所有單字收藏，但不會刪除其他 localStorage 資料。建議先匯出 JSON 備份。是否繼續？";
    if (!window.confirm(warning)) {
      return;
    }
    if (!window.confirm("二次確認：確定要清除所有單字嗎？")) {
      return;
    }
    window.JLL.storage.saveVocabulary([]);
    showMessage("已清除所有單字收藏。");
    if (window.JLL.vocabulary && window.JLL.vocabulary.renderVocabularyList) {
      window.JLL.vocabulary.renderVocabularyList();
    }
  }

  function showMessage(text) {
    const preview = window.JLL.dom.qs("#import-preview");
    preview.hidden = false;
    preview.replaceChildren(window.JLL.dom.createElement("p", { text }));
  }

  document.addEventListener("DOMContentLoaded", setupBackup);

  window.JLL = window.JLL || {};
  window.JLL.backup = { analyzePayload };
})();
