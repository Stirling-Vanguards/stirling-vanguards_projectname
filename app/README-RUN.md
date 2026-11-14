# Run locally
Do NOT double-click the .html files (browsers block ES modules on file://).
- Windows: double-click `serve.bat`, then open http://localhost:8000/index.html
- Mac/Linux: `./serve.sh`
Pages: index.html (home), explore.html (Earth atlas), moon.html, mars.html, design-system/index.html.

New: `src/map/bodyMap.js` = interactive Moon/Mars map (used by `src/pages/target.js`).
Target markers live in `src/data/targets.js` (`marker`), styles at the end of `src/styles/map.css`.
