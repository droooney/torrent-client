import { serialize } from 'cookie';
import retry from 'promise-retry';
import KeeneticCommand from 'router-client/providers/KeeneticCommand';
import GetClientsList from 'router-client/providers/keenetic/commands/GetDevicesList';
import { parse } from 'set-cookie-parser';
import { z } from 'zod';

import { SECOND } from 'constants/date';

import { RouterDevice, RouterProvider } from 'router-client/types';

import CustomError, { ErrorCode } from 'utilities/CustomError';
import { createHash } from 'utilities/hash';

export default class KeeneticClient implements RouterProvider {
  private _sessionId: string = '';
  private _token: string = '';

  readonly host: string;

  constructor() {
    this.host = `http://${process.env.ROUTER_HOSTNAME}`;
  }

  async auth(): Promise<void> {
    const login = process.env.KEENETIC_LOGIN ?? '';
    const password = process.env.KEENETIC_PASSWORD ?? '';

    const tryAuthResponse = await fetch(`${this.host}/auth`);

    const realm = tryAuthResponse.headers.get('x-ndm-realm') ?? '';
    const challenge = tryAuthResponse.headers.get('x-ndm-challenge') ?? '';
    const cookies = parse(tryAuthResponse.headers.get('set-cookie') ?? '');
    const sessionCookie = cookies.find(({ name }) => /^[A-Z]+$/.test(name));

    this._sessionId = sessionCookie?.name ?? '';
    this._token = sessionCookie?.value ?? '';

    await fetch(`${this.host}/auth`, {
      method: 'POST',
      body: JSON.stringify({
        login,
        password: createHash('sha256', challenge + createHash('md5', [login, realm, password].join(':'))),
      }),
      headers: {
        'Content-Type': 'application/json',
        Cookie: serialize(this._sessionId, this._token),
      },
    });
  }

  private async callRci(command: string): Promise<Response> {
    let response: Response;

    try {
      response = await retry(
        async () => {
          if (!this._sessionId || !this._token) {
            await this.auth();
          }

          const response = await fetch(`${this.host}/rci/`, {
            method: 'POST',
            body: JSON.stringify({
              parse: command,
            }),
            headers: {
              'Content-Type': 'application/json',
              Cookie: serialize(this._sessionId, this._token),
            },
          });

          if (response.status === 401) {
            this._sessionId = '';
            this._token = '';

            throw new Error('Unauthorized');
          }

          return response;
        },
        {
          factor: 1.5,
          maxRetryTime: 10 * SECOND,
        },
      );
    } catch (err) {
      throw new CustomError(ErrorCode.UNAUTHORIZED, 'Ошибка авторизации', {
        cause: err,
      });
    }

    if (!response.ok) {
      throw new CustomError(ErrorCode.KEENETIC_ERROR, 'Ошибка выполнения команды', {
        details: await response.text(),
      });
    }

    return response;
  }

  async getDevices(): Promise<RouterDevice[]> {
    const clientsList = await this.rci(GetClientsList);

    return clientsList.host.map(({ active, link, ...device }) => ({
      ...device,
      online: active && link === 'up',
    }));
  }

  private async rci<T>(command: KeeneticCommand<T>): Promise<T> {
    const response = await this.callRci(command.command);
    const json: unknown = await response.json();
    const parsed = z
      .object({
        parse: command.schema,
      })
      .safeParse(json);

    if (!parsed.success) {
      throw new CustomError(ErrorCode.KEENETIC_ERROR, 'Ошибка выполнения команды', {
        cause: parsed.error,
        details: json,
      });
    }

    return parsed.data.parse as T;
  }
}
