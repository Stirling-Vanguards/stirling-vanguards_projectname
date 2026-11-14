#!/usr/bin/env sh
# Vanguard Atlas local server (browsers block ES modules on file://).
cd "$(dirname "$0")" && echo "Open http://localhost:8000/index.html" && python3 -m http.server 8000
