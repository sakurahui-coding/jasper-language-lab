# GitHub Pages Checklist

## Repository Settings

- [ ] Repository has the latest `main` branch pushed.
- [ ] Settings -> Pages is set to GitHub Actions.
- [ ] The `Deploy GitHub Pages` workflow completed successfully.
- [ ] The public Pages URL opens without requiring login.

## Deployment Smoke Test

- [ ] Home page opens.
- [ ] Lessons page opens at `lessons.html`.
- [ ] Reading page opens with a valid lesson: `reading.html?lesson=europe-dam-removal`.
- [ ] Invalid lesson slugs show a friendly not-found state.
- [ ] CSS loads correctly on the deployed subpath.
- [ ] JavaScript loads correctly on the deployed subpath.
- [ ] JSON lesson data loads correctly on the deployed subpath.
- [ ] Navigation links use relative paths and do not start with `/`.
- [ ] Mobile viewport around 375px has no horizontal overflow.
- [ ] WordPress article links point to the current GitHub Pages URL.

## Content Safety

- [ ] No passwords, tokens, cookies, or API keys are committed.
- [ ] No complete copyrighted article is committed without authorization.
- [ ] No complete copyrighted lyrics are committed.
