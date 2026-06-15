const fs = require('fs');

const filesToClean = ['src/App.jsx', 'src/App.css'];

function removeDuplicateConstBlocks(content, declaration) {
  const blockPattern = new RegExp(`\\n?\\s*const ${declaration} = [\\s\\S]*?;`, 'g');
  const matches = [...content.matchAll(blockPattern)];

  if (matches.length <= 1) {
    return content;
  }

  let cleaned = content;

  for (let index = matches.length - 1; index >= 1; index -= 1) {
    const match = matches[index];
    cleaned = `${cleaned.slice(0, match.index)}${cleaned.slice(match.index + match[0].length)}`;
  }

  return cleaned;
}


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

    content = removeDuplicateConstBlocks(content, 'impressoras');
    content = removeDuplicateConstBlocks(content, 'totalImpressoras');
  }

  fs.writeFileSync(filePath, `${content.trimEnd()}\n`);
}
