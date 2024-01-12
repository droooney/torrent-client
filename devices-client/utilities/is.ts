const MAC_REGEX = /^(?:[0-9a-f]{2}:){5}[0-9a-f]{2}$/i;

export function isMac(mac: string): boolean {
  return MAC_REGEX.test(mac);
}
