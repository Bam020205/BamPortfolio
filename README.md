# Abram Seneca’s portfolio

The portfolio is a static site. Open the root `index.html` in a browser to browse it directly. For a local HTTP preview with Python available, run `python -m http.server 8000 --bind 127.0.0.1` in the repository and open `http://127.0.0.1:8000/`.

Edit page copy and shared markup in `build.mjs`, then run `node build.mjs` and commit the regenerated HTML. Styles and browser interactions live in `site.css` and `site.js`. Each directory contains a complete HTML page, and its links work on a static host even when the site is served from a subdirectory.

The inventory walkthrough uses a web-encoded copy of the original recording. To play the complete original DeTerminator MP4 locally, copy `DSTF RIM I2 - DeTerminator.mp4` from the source collection to `media/determinator-original.mp4`. The original exceeds GitHub’s file-size limit for regular repository files. The player falls back to the preview when the original is absent, and the project page links to the full video on Google Drive.
