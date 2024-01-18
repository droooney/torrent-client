const MAC_REGEX = /^(?:[0-9A-F]{2}:){5}[0-9A-F]{2}$/;

export function isMac(mac: string): boolean {
  return MAC_REGEX.test(mac);
}
