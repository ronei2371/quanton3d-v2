const fs = require('fs');

const filesToClean = ['src/App.jsx', 'src/App.css'];

for (const filePath of filesToClean) {
  let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

  content = content
    .split('\n')
    .filter((line) => !/^\s*codex\//.test(line))
    .filter((line) => !/<<<<<<<|=======|>>>>>>>/.test(line))
    .filter((line) => line.trim() !== 'main')
    .join('\n');

  if (filePath.endsWith('.jsx')) {
    const exportMarker = 'export default App;';
    const exportIndex = content.indexOf(exportMarker);

    if (exportIndex >= 0) {
      content = content.slice(0, exportIndex + exportMarker.length);
    }
  }

  fs.writeFileSync(filePath, `${content.trimEnd()}\n`);
}
