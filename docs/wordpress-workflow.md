# WordPress Workflow

WordPress.com is used for public lesson pages, navigation, categories, tags, YouTube embeds, and links to interactive GitHub Pages practice.

## Manual Publishing

1. Open WordPress.com and create a new post.
2. Select the correct category and tags from `wordpress/category-map.json`.
3. Paste `wordpress/block-editor-template.html` into a Custom HTML block, or use `templates/lesson-template.md` for Markdown-style drafting.
4. Add the official YouTube embed block if needed.
5. Add the GitHub Pages interactive practice link.
6. Preview on mobile and desktop.
7. Publish manually.

## Linking to Interactive Lessons

Each interactive lesson uses this URL format:

```text
https://your-github-pages-url/reading.html?lesson=what-never-changes
```

The `lesson` value must match the `slug` in `web/data/lessons.json`.

## Start Learning Button

In a WordPress paragraph or Custom HTML block, add a clear button-style link:

```html
<p><a href="https://your-github-pages-url/reading.html?lesson=what-never-changes">開始互動學習</a></p>
```

If the GitHub Pages URL changes, update:

- WordPress article links.
- `wordpress/interactive-link-template.md` examples.
- Any static links in public lesson descriptions or menus.

## WordPress and GitHub Pages Responsibilities

WordPress handles public posts, navigation, categories, tags, summaries, and official YouTube embeds. GitHub Pages handles interactive vocabulary cards, review, backup/import, progress stats, and reading prototypes.

## Free Plan Limits

The WordPress.com free plan should not be treated as a custom app server. Do not assume plugin installation, PHP theme editing, database access, arbitrary JavaScript execution, or automated publishing.

Do not copy full copyrighted articles or full lyrics into the public repository. Use original text, licensed material, public-domain material, or short permitted excerpts with sources.

## Restrictions

- Do not install plugins.
- Do not modify PHP themes.
- Do not automate login or publishing.
- Do not store passwords, cookies, tokens, or private data.
