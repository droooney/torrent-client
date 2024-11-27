import { createHash as cryptoCreateHash } from 'node:crypto';

export function createHash(algorithm: string, value: string): string {
  return cryptoCreateHash(algorithm).update(value).digest('hex');
}
