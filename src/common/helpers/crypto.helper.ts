import {
  randomBytes,
  scrypt as _scrypt,
  timingSafeEqual,
  createVerify,
} from 'crypto';

import { promisify } from 'util';

const scrypt = promisify(_scrypt);

const SALT_BYTES = 16;
const HASH_BYTES = 64;

/* =========================
   PASSWORDS
========================= */

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(SALT_BYTES).toString('hex');

  const derivedKey = (await scrypt(password, salt, HASH_BYTES)) as Buffer;

  return `${salt}:${derivedKey.toString('hex')}`;
};

export const verifyPassword = async (
  password: string,
  stored: string,
): Promise<boolean> => {
  if (!password || !stored) return false;

  const [salt, key] = stored.split(':');

  if (!salt || !key) return false;

  const derivedKey = (await scrypt(password, salt, HASH_BYTES)) as Buffer;

  const keyBuffer = Buffer.from(key, 'hex');

  if (keyBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(keyBuffer, derivedKey);
};

/* =========================
   BIOMETRIC
========================= */

export const publicKeyBase64ToPem = (base64Key: string): string => {
  if (!base64Key) {
    throw new Error('La clave pública no puede estar vacía.');
  }

  const lines = base64Key.match(/.{1,64}/g)?.join('\n');

  return `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----`;
};

export const verifyBiometricSignature = (
  challenge: string,
  signature: string,
  publicKey: string,
): boolean => {
  if (!challenge || !signature || !publicKey) {
    throw new Error('Challenge, signature y publicKey son requeridos.');
  }

  const challengeBuffer = Buffer.from(challenge, 'base64');

  const signatureBuffer = Buffer.from(signature, 'base64');

  const verifier = createVerify('RSA-SHA256');

  verifier.update(challengeBuffer);
  verifier.end();

  return verifier.verify(publicKey, signatureBuffer);
};
