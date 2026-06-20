const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'App.jsx');
const cssPath = path.join(__dirname, '..', 'src', 'App.css');

function cleanCommon(source) {
  return source
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => !/fix-integration-errors-and-improve-performance|<<<<<<<|=======|>>>>>>>/.test(line))
    .filter((line) => !/^\s*codex\//.test(line))
    .filter((line) => line.trim() !== 'main')
    .join('\n');
}

function cleanApp(source) {
  let output = cleanCommon(source);
  const exportMarker = 'export default App;';
  const exportIndex = output.indexOf(exportMarker);

  if (exportIndex >= 0) {
    output = output.slice(0, exportIndex + exportMarker.length);
  }

  output = output.replace(
    /<p>\s*\?\s*("Veja fotos aprovadas[^\n]+?")\s*:\s*("Envie uma foto real[^\n]+?")\s*<\/p>/g,
    (_match, _galleryText, submitText) => `<p>{${submitText}}</p>`
  );

  const impressorasStart = output.indexOf('  const impressoras = Array.from(');
  const selecionarResinaStart = output.indexOf('  function selecionarResina', impressorasStart);

  if (impressorasStart >= 0 && selecionarResinaStart > impressorasStart) {
    const impressorasBlock = `  const impressoras = Array.from(
    new Set(
      parametros
        .filter((item) => chaveResina(item.resina) === chaveResina(resinaSelecionada) && item.impressora)
        .map((item) => (item.marca ? item.marca + " - " + item.impressora : item.impressora))
    )
  ).sort((a, b) => a.localeCompare(b));

  const totalImpressoras = new Set(
    parametros
      .filter((item) => item.impressora)
      .map((item) => (item.marca || "") + "-" + item.impressora)
  ).size;

`;

    output = output.slice(0, impressorasStart) + impressorasBlock + output.slice(selecionarResinaStart);
  }

  return output.trimEnd() + '\n';
}

fs.writeFileSync(appPath, cleanApp(fs.readFileSync(appPath, 'utf8')));

if (fs.existsSync(cssPath)) {
  fs.writeFileSync(cssPath, cleanCommon(fs.readFileSync(cssPath, 'utf8')).trimEnd() + '\n');
}
