# Content Workflow

1. Choose a learning goal and one short source topic.
2. Write or adapt only authorized content.
3. Create a lesson draft in `content/`.
4. Add vocabulary, phrases, grammar notes, important sentences, practice, and answer key.
5. Add interactive vocabulary data in `web/data/`.
6. Preview the static pages locally.
7. Prepare the WordPress version with the HTML or Markdown template.
8. Manually publish only after review.

For copyrighted materials, use short excerpts only when allowed and link to the original source. Do not republish full protected articles or full lyrics.

## 排版整理 Workflow

When the user provides an article and asks for `排版整理`, create a public-safe teaching unit instead of copying the full source text.

1. Identify title, author, source link, level, topic, and publication context.
2. Convert the source into a transformed lesson summary and 3-5 short reading paragraphs with Traditional Chinese translation.
3. Prepare vocabulary, phrases, grammar notes, important sentences, practice questions, answer key, and source note.
4. Add the interactive JSON lesson under `web/data/lessons/` and register it in `web/data/lessons.json`.
5. Add a teacher-facing Markdown draft under `content/english/`.
6. Add WordPress Markdown and Block Editor drafts under `wordpress/`.
7. Test the local reading page, lesson list, vocabulary click cards, translation toggle, font controls, navigation, and speech warning.
8. Commit and push to GitHub Pages after review.

If the source is copyrighted, publish only transformed summaries, short learning sentences, vocabulary, and exercises. Keep full excerpts in private or password-protected classroom spaces only.
