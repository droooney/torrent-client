import { Device, DeviceManufacturer, DeviceType } from '@prisma/client';
import { InlineKeyboard, Markdown } from '@tg-sensei/bot';

import { AddDevicePayload, AddDevicePayloadField } from 'devices-client/types/device';
import { InlineKeyboardButtons } from 'telegram-bot/types/keyboard';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import { DeviceState } from 'devices-client/utilities/DevicesClient';
import { backToCallbackButton } from 'telegram-bot/utilities/keyboard';

import { callbackDataProvider } from 'telegram-bot/bot';

const DEVICE_TYPE_ICON_MAP: Record<DeviceType, string> = {
  [DeviceType.Tv]: '📺',
  [DeviceType.Lightbulb]: '💡',
  [DeviceType.Socket]: '🔌',
  [DeviceType.Other]: '❓',
  [DeviceType.Unknown]: '❓',
};

const DEVICE_TYPE_NAME_MAP: Record<DeviceType, string> = {
  [DeviceType.Tv]: 'Телевизор',
  [DeviceType.Lightbulb]: 'Лампочка',
  [DeviceType.Socket]: 'Розетка',
  [DeviceType.Other]: 'Другой',
  [DeviceType.Unknown]: 'Неизвестно',
};

const ADD_DEVICE_FIELDS_INFO: Record<AddDevicePayloadField, { icon: string; name: string }> = {
  name: {
    icon: '🅰️',
    name: 'Название',
  },
  type: {
    icon: '🔤',
    name: 'Тип',
  },
  manufacturer: {
    icon: '🏭',
    name: 'Производитель',
  },
  mac: {
    icon: '🔠',
    name: 'MAC',
  },
  address: {
    icon: '🌐',
    name: 'IP-адрес',
  },
  usedForAtHomeDetection: {
    icon: '🏠',
    name: 'Используется для определения местоположения',
  },
};

const DEVICE_STATE_FIELDS_INFO: Record<keyof DeviceState, { icon: string; name: string }> = {
  online: {
    icon: '📶',
    name: 'Статус',
  },
  power: {
    icon: '⚡',
    name: 'Питание',
  },
};

export function getDeviceIcon(deviceType: DeviceType): string {
  return DEVICE_TYPE_ICON_MAP[deviceType];
}

export function getDeviceTypeString(deviceType: DeviceType): string {
  return DEVICE_TYPE_NAME_MAP[deviceType];
}

export function getDeviceManufacturerString(manufacturer: DeviceManufacturer): string {
  if (manufacturer === DeviceManufacturer.Other) {
    return 'Другой';
  }

  if (manufacturer === DeviceManufacturer.Unknown) {
    return 'Неизвестно';
  }

  return manufacturer;
}

export function formatDeviceFields<Field extends AddDevicePayloadField>(
  data: Pick<Device, Field>,
  fields: Field[],
): Markdown {
  return Markdown.join(
    fields.map((field) => {
      return formatDeviceField(field, data[field] as any as AddDevicePayload[Field]);
    }),
    '\n',
  );
}

export function formatDeviceEnteredFields(
  addDevicePayload: AddDevicePayload,
  fields: [AddDevicePayloadField, ...AddDevicePayloadField[]],
): Markdown {
  return Markdown.create`${Markdown.bold('Введенные данные')}:
${formatDeviceFields(addDevicePayload, fields)}`;
}

export function formatDeviceField<Field extends AddDevicePayloadField>(
  field: Field,
  value: AddDevicePayload[Field],
): Markdown {
  const { icon, name } = ADD_DEVICE_FIELDS_INFO[field];
  const formattedValue =
    field === 'type'
      ? Markdown.create`${getDeviceIcon(value as DeviceType)} ${getDeviceTypeString(value as DeviceType)}`
      : field === 'mac'
        ? value
          ? Markdown.fixedWidth(value as string)
          : Markdown.italic('Отсутствует')
        : field === 'manufacturer'
          ? getDeviceManufacturerString(value as DeviceManufacturer)
          : field === 'address'
            ? value
              ? String(value)
              : Markdown.italic('Отсутствует')
            : field === 'usedForAtHomeDetection'
              ? value
                ? 'Да'
                : 'Нет'
              : String(value);

  return Markdown.create`${icon} ${Markdown.bold(name)}: ${formattedValue}`;
}

export function formatDevice(device: Device): Markdown {
  return formatDeviceFields(device, ['name', 'type']);
}

export function formatDeviceStateFields<Field extends keyof DeviceState>(
  state: DeviceState,
  fields: Field[],
): Markdown {
  return Markdown.join(
    fields.map((field) => {
      return formatDeviceStateField(field, state[field]);
    }),
    '\n',
  );
}

export function formatDeviceStateField<Field extends keyof DeviceState>(
  field: Field,
  value: DeviceState[Field],
): Markdown {
  const { icon, name } = DEVICE_STATE_FIELDS_INFO[field];
  const formattedValue =
    field === 'online'
      ? `${value ? '🟢 Онлайн' : '🔴 Оффлайн'}`
      : field === 'power'
        ? value === 'unknown'
          ? Markdown.italic('Неизвестно')
          : value
            ? '🟢 Включено'
            : '🔴 Выключено'
        : '';

  return Markdown.create`${icon} ${Markdown.bold(name)}: ${formattedValue}`;
}

export function getBackToEditDeviceKeyboardButtons(deviceId: number): InlineKeyboardButtons {
  return [
    [
      backToCallbackButton('К редактированию', {
        type: DevicesClientCallbackButtonType.EditDevice,
        deviceId,
      }),
    ],
    [
      backToCallbackButton('К устройству', {
        type: DevicesClientCallbackButtonType.OpenDevice,
        deviceId,
      }),
      backToCallbackButton('К списку', {
        type: DevicesClientCallbackButtonType.OpenDevicesList,
      }),
    ],
  ];
}

export async function getBackToEditDeviceKeyboard(deviceId: number): Promise<InlineKeyboard> {
  return callbackDataProvider.buildInlineKeyboard(getBackToEditDeviceKeyboardButtons(deviceId));
}
