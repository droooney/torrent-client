import { isIPv4 } from 'node:net';

const MAC_REGEX = /^(?:[0-9A-F]{2}:){5}[0-9A-F]{2}$/;

export function isMac(mac: string): boolean {
  return MAC_REGEX.test(mac);
}

export function isIp(address: string): boolean {
  return isIPv4(address);
}
