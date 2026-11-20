export class ApiError extends Error { constructor(status, message) { super(message); this.status = status; } }
export const fail = (message, status = 400) => { throw new ApiError(status, message); };
export function text(value, name, min = 0, max = 500) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max || /\u0000/.test(value)) fail(`Enter a valid ${name} (${min}–${max} characters).`);
  return value.trim();
}
export function integer(value, name, min = 0, max = 100000000) {
  if (!Number.isSafeInteger(value) || value < min || value > max) fail(`Enter a valid ${name}.`);
  return value;
}
export function email(value) {
  const clean = text(value, 'email address', 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) fail('Enter a valid email address.');
  return clean;
}
export function phone(value) {
  const clean = text(value, 'phone number', 9, 40);
  if (!/^[+\d\s()-]+$/.test(clean) || clean.replace(/\D/g, '').length < 9 || clean.replace(/\D/g, '').length > 15) fail('Enter a valid phone number.');
  return clean;
}
export function object(value) { if (!value || typeof value !== 'object' || Array.isArray(value)) fail('A valid request body is required.'); return value; }
