import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

const MIMES_VALIDOS = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

const EXT_MAP = {
  'image/jpeg': 'jpg',
  'image/jpg':  'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/gif':  'gif',
  'image/avif': 'avif',
};

/**
 * Recebe um DataURI base64, faz upload para o R2 e retorna a URL pública.
 * @param {string} base64DataUri  ex.: "data:image/png;base64,iVBOR..."
 * @param {string} pasta          prefixo de pasta no bucket (ex.: "gallery")
 * @returns {Promise<string>}     URL pública no CDN do R2
 */
export async function uploadBase64ParaR2(base64DataUri, pasta = 'gallery') {
  const match = /^data:([a-z0-9.+\/-]+);base64,(.+)$/i.exec(base64DataUri || '');
  if (!match) throw new Error('DataURI inválida ou ausente');

  const mime = match[1].toLowerCase();
  if (!MIMES_VALIDOS.has(mime)) throw new Error(`Formato de imagem não suportado: ${mime}`);

  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length === 0) throw new Error('Imagem vazia');

  const ext = EXT_MAP[mime] || 'jpg';
  const key = `${pasta}/${randomUUID()}.${ext}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mime,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  return `${PUBLIC_URL}/${key}`;
}

/**
 * Remove uma imagem do R2 a partir da sua URL pública.
 * Opera de forma silenciosa — erros são apenas logados.
 * @param {string} imagemUrl  URL pública retornada por uploadBase64ParaR2
 */
export async function deletarImagemR2(imagemUrl) {
  if (!imagemUrl || !PUBLIC_URL || !imagemUrl.startsWith(PUBLIC_URL)) return;

  const key = imagemUrl.slice(PUBLIC_URL.length + 1);
  if (!key) return;

  try {
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (err) {
    console.error('[R2] Erro ao deletar imagem:', err.message);
  }
}
