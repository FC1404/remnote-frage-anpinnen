const fs = require('node:fs');
const { parseManifest } = require('@remnote/plugin-sdk/dist/lib');
const parsed = parseManifest(JSON.parse(fs.readFileSync('public/manifest.json', 'utf8')));
if (!parsed.success) {
  console.error(parsed.errors);
  process.exit(1);
}
if (!fs.readFileSync('README.md', 'utf8').trim()) throw new Error('README fehlt.');
console.log('RemNote-Manifest geprüft.');
