// Reduz a foto no próprio celular/computador antes de enviar: lado maior de até 1600 px,
// JPEG qualidade 0,8. Uma foto de celular (3–6 MB) vira ~200–400 KB, com detalhe de sobra
// para análise técnica. Economiza banco de dados e deixa o envio mais rápido.
// Se o navegador não conseguir ler a imagem, devolve o arquivo original.
const LADO_MAXIMO = 1600;
const QUALIDADE = 0.8;

function carregarImagem(arquivo) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

export async function comprimirImagem(arquivo) {
  if (!arquivo || !/^image\//.test(arquivo.type) || /gif|svg/.test(arquivo.type)) return arquivo;
  try {
    const img = await carregarImagem(arquivo);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(img.naturalWidth, img.naturalHeight));
    const largura = Math.round(img.naturalWidth * escala);
    const altura = Math.round(img.naturalHeight * escala);
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff"; // PNG com fundo transparente não fica preto no JPEG
    ctx.fillRect(0, 0, largura, altura);
    ctx.drawImage(img, 0, 0, largura, altura);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALIDADE));
    if (!blob || blob.size >= arquivo.size) return arquivo;
    const nome = arquivo.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], nome, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return arquivo;
  }
}

export async function comprimirImagens(arquivos = []) {
  return Promise.all(Array.from(arquivos).map(comprimirImagem));
}
