import path from 'node:path';

import mime from 'mime';

const EXTENSION_EXCEPTIONS: Partial<Record<string, string>> = {
  srt: 'text',
};

const MIME_TYPE_ICONS: Partial<Record<string, string>> = {
  audio: '🎵',
  image: '🖼',
  text: '📄',
  video: '📽',
};

export function getFileIcon(filePath: string, defaultIcon = '❓'): string {
  const extension = path.extname(filePath);
  let type = EXTENSION_EXCEPTIONS[extension.replace(/\./, '')];

  if (!type) {
    const mimeType = mime.getType(filePath);

    if (mimeType) {
      type = mimeType.match(/^\w+(?=\/)/)?.at(0);
    }
  }

  return (type ? MIME_TYPE_ICONS[type] : null) ?? defaultIcon;
}
