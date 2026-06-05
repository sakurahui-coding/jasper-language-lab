# Deployment

## GitHub Pages

Deploy the `web/` folder as the public site.

Recommended settings:

- Source: Deploy from a branch
- Branch: `main`
- Folder: `/web`

## Local Preview

```bash
cd web
python3 -m http.server 8080
```

Open `http://localhost:8080/`.

## Pre-Deploy Checklist

- JSON files parse correctly.
- Main pages open without console errors.
- 375px mobile width has no horizontal overflow.
- Buttons are keyboard reachable.
- WordPress content remains manually published.

