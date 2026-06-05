(function () {
  "use strict";

  function isSupported() {
    return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  }

  function speak(text, lang) {
    if (!isSupported() || !text) {
      return false;
    }
    const utterance = new SpeechSynthesisUtterance(String(text));
    utterance.lang = lang || "en-US";
    utterance.rate = 0.88;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
  }

  window.JLL = window.JLL || {};
  window.JLL.speech = { isSupported, speak };
})();

