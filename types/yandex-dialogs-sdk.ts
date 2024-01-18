import { IApiEntity, IApiEntityBase, Intent } from 'yandex-dialogs-sdk/dist/api/nlu';

declare module 'yandex-dialogs-sdk/dist/api/nlu' {
  // @ts-ignore
  export type AnyApiEntity = IApiEntity | IApiEntityYandexString;

  // @ts-ignore
  export interface IApiEntityYandexString extends IApiEntityBase {
    type: 'YANDEX.STRING';
    value: string;
  }

  export interface Intent {
    slots: Partial<Record<string, AnyApiEntity>>;
  }

  export interface IApiRequestNlu {
    intents?: Partial<Record<string, Intent>>;
  }
}
