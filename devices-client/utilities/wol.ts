import dgram from 'node:dgram';
import net from 'node:net';

import CustomError, { ErrorCode } from 'utilities/CustomError';
import { prepareErrorForLogging } from 'utilities/error';

export interface WakeOnLanOptions {
  mac: string;
  address: string;
  attempts?: number;
}

const MAC_BYTES = 6;
const MAC_REPETITIONS = 16;
const PORTS = [7, 9];

export async function wakeOnLan(options: WakeOnLanOptions): Promise<void> {
  const { mac, address, attempts = 10 } = options;

  const magicPacket = createMagicPacket(mac);

  const socket = dgram.createSocket(net.isIPv6(address) ? 'udp6' : 'udp4');
  let attempt = 0;

  const wakeAttempt = async (): Promise<void> => {
    if (++attempt >= attempts) {
      return;
    }

    await Promise.all(
      PORTS.map(async (port) => {
        await new Promise((resolve, reject) => {
          socket.send(magicPacket, 0, magicPacket.length, port, address, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(err);
            }
          });
        });
      }),
    );
  };

  socket.on('error', (err) => {
    console.log(prepareErrorForLogging(err));
  });

  socket.once('listening', () => {
    socket.setBroadcast(true);
  });

  try {
    await wakeAttempt();
  } catch (err) {
    throw new CustomError(ErrorCode.NETWORK_ERROR, 'Ошибка отправки пакета', {
      cause: err,
    });
  }
}

function createMagicPacket(mac: string): Buffer {
  const macBuffer = Buffer.alloc(MAC_BYTES);

  mac.split(':').forEach((value, i) => {
    macBuffer[i] = parseInt(value, 16);
  });

  const buffer = Buffer.alloc(MAC_BYTES + MAC_REPETITIONS * MAC_BYTES);

  for (let i = 0; i < MAC_BYTES; i++) {
    buffer[i] = 0xff;
  }

  for (let i = 0; i < MAC_REPETITIONS; i++) {
    macBuffer.copy(buffer, (i + 1) * MAC_BYTES, 0, macBuffer.length);
  }

  return buffer;
}
