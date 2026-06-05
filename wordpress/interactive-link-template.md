# Interactive Practice Link Template

Use this when manually publishing a WordPress lesson.

Recommended setup:

1. Put the full reading article in a WordPress password-protected post or page.
2. Put the interactive practice link below the article.
3. Keep GitHub Pages focused on vocabulary, grammar, short excerpts, review, and practice.

## Button Text

開始互動學習

## Link Format

```text
https://sakurahui-coding.github.io/jasper-language-lab/reading.html?lesson=what-never-changes
```

Replace `what-never-changes` with the lesson slug from `web/data/lessons.json` when you create a new lesson.

## Custom HTML Block Example

```html
<p>
  <a href="https://sakurahui-coding.github.io/jasper-language-lab/reading.html?lesson=what-never-changes">
    開始互動學習
  </a>
</p>
```

## Suggested WordPress Paragraph

完成文章閱讀後，請點選「開始互動學習」進入單字卡、朗讀與複習練習。

## Password-Protected WordPress Flow

WordPress article:

- Visibility: Password protected
- Content: full article, teacher notes, source notes
- Button: link to the GitHub Pages interactive lesson

GitHub Pages interactive lesson:

- Content: short excerpt, vocabulary, phrases, grammar, important sentences, quiz, review
- Public URL: safe to share as a practice tool
