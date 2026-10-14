const zip = require('bestzip');
const fs = require('node:fs');
const destination = 'public/source.zip';
if (fs.existsSync(destination)) fs.unlinkSync(destination);
zip({ destination, source: [
  'src', 'scripts', 'tests', 'public/manifest.json', 'README.md', 'LICENSE',
  'package.json', 'package-lock.json', 'tsconfig.json', 'webpack.config.js',
  'postcss.config.js', 'tailwind.config.js', 'Plugin starten.command',
] }).catch((error) => { console.error(error); process.exitCode = 1; });
