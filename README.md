# Abram Seneca’s portfolio

The portfolio is a static site. Serve the repository root with any static HTTP server. For a local preview with Python available, run `python -m http.server 8000 --bind 127.0.0.1` in the repository and open `http://127.0.0.1:8000/`.

Edit page copy and shared markup in `build.mjs`, then run `node build.mjs` and commit the regenerated HTML. Styles and browser interactions live in `site.css` and `site.js`. Each directory contains a complete HTML page, and its links work on a static host even when the site is served from a subdirectory.

The project pages use web-encoded copies from the original recordings. The DeTerminator video is a short excerpt from the science fair presentation. The original recordings and project documentation are in the local source collection.
