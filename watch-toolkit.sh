#!/bin/bash
fswatch -o /Users/kathryndasso/viewpoint-advisory-website/viewpoint-toolkit.html | while read f; do
  cd /Users/kathryndasso/viewpoint-advisory-website
  rm -f .git/index.lock
  git add viewpoint-toolkit.html
  git commit -m "Auto: update toolkit"
  git push origin main
done
