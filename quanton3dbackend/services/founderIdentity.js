export function normalizePhone(value = '') {
  const digits = String(value || '').replace(/\D/g, '');
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    return digits.slice(2);
  }
  return digits;
}

export function getFounderPhones(env = process.env) {
  return String(env.FOUNDER_PHONES || '')
    .split(/[,;\n]+/)
    .map(normalizePhone)
    .filter((phone) => phone.length >= 10 && phone.length <= 11);
}

export function isFounderPhone(value, env = process.env) {
  const phone = normalizePhone(value);
  if (phone.length < 10 || phone.length > 11) return false;
  return getFounderPhones(env).includes(phone);
}
