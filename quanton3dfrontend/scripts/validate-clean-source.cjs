const fs = require('fs');

const filesToValidate = [
  'src/App.jsx',
  'src/App.css',
  'package.json',
];

const forbiddenPatterns = [
  { label: 'marcador de branch codex/', regex: /^\s*codex\//m },
  { label: 'marcador de conflito <<<<<<<', regex: /<<<<<<< / },
  { label: 'marcador de conflito =======', regex: /^=======$/m },
  { label: 'marcador de conflito >>>>>>>', regex: />>>>>>> / },
  { label: 'linha solta main', regex: /^\s*main\s*$/m },
];

let hasError = false;

for (const filePath of filesToValidate) {
  const content = fs.readFileSync(filePath, 'utf8');

  for (const pattern of forbiddenPatterns) {
    if (pattern.regex.test(content)) {
      console.error(`ERRO: ${filePath} contém ${pattern.label}.`);
      hasError = true;
    }
  }

  if (filePath === 'src/App.css') {
    const rootMatches = content.match(/:root\s*\{/g) || [];

    if (rootMatches.length !== 1) {
      console.error(`ERRO: ${filePath} deve conter exatamente 1 bloco :root, mas contém ${rootMatches.length}.`);
      hasError = true;
    }
  }
}

if (hasError) {
  process.exit(1);
}

console.log('Arquivos principais estão limpos: sem codex, sem conflitos e com App.css válido.');
