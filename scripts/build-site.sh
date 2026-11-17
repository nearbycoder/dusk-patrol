#!/usr/bin/env sh
# Assemble the GitHub Pages site: the marketing page from site/ plus the game at /play/.
# Local preview:  sh scripts/build-site.sh && python3 -m http.server 8000 -d _site
set -eu
cd "$(dirname "$0")/.."
rm -rf _site
mkdir -p _site/play
cp -R site/. _site/
cp index.html _site/play/index.html
touch _site/.nojekyll
echo "built _site/ ($(du -sh _site | cut -f1))"
