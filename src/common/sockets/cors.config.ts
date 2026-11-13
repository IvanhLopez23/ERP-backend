import 'dotenv/config';

const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:4200',
];

export const CORS_ORIGINS = (
  process.env.CORS_ORIGINS ?? DEFAULT_CORS_ORIGINS.join(',')
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const CORS_ORIGIN_OPTION = CORS_ORIGINS.includes('*')
  ? '*'
  : CORS_ORIGINS;

export function esOrigenPermitido(origin?: string): boolean {
  if (!origin) return true;
  return CORS_ORIGINS.includes('*') || CORS_ORIGINS.includes(origin);
}
