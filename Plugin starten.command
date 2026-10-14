#!/bin/zsh
set -e
cd -- "${0:A:h}"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v node >/dev/null 2>&1; then
  echo "Bitte installiere zuerst Node.js von https://nodejs.org und starte diese Datei erneut."
  read -r "?Zum Schließen Enter drücken."
  exit 1
fi
if [ ! -f dist/manifest.json ]; then
  if [ ! -d node_modules ]; then npm ci; fi
  npm run build
fi
echo "Frage anpinnen wird gestartet. Dieses Fenster während der Nutzung geöffnet lassen."
echo "In RemNote unter Plugins → Build → Develop from localhost: http://localhost:8080"
npm start
