import { Device, DeviceManufacturer, DeviceType } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';

import { AddDevicePayload, AddDevicePayloadField } from 'devices-client/types/device';
import { InlineKeyboard } from 'telegram-bot/types/keyboard';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import { backToCallbackButton } from 'telegram-bot/utilities/keyboard';

const DEVICE_TYPE_ICON_MAP: Record<DeviceType, string> = {
  [DeviceType.Tv]: '📺',
  [DeviceType.Lightbulb]: '💡',
  [DeviceType.Other]: '❓',
};

const DEVICE_TYPE_NAME_MAP: Record<DeviceType, string> = {
  [DeviceType.Tv]: 'Телевизор',
  [DeviceType.Lightbulb]: 'Лампочка',
  [DeviceType.Other]: 'Неизвестно',
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
    name: 'Адрес',
  },
};

export function getDeviceIcon(deviceType: DeviceType): string {
  return DEVICE_TYPE_ICON_MAP[deviceType];
}

export function getDeviceTypeString(deviceType: DeviceType): string {
  return DEVICE_TYPE_NAME_MAP[deviceType];
}

export function formatDeviceFields<Field extends AddDevicePayloadField>(
  data: Pick<Device, Field>,
  fields: Field[],
): Markdown {
  return Markdown.join(
    fields.map((field) => {
      return formatDeviceField(field, data[field]);
    }),
    '\n',
  );
}

export function formatEnteredFields(
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
  const formattedValue =
    field === 'type'
      ? Markdown.create`${getDeviceIcon(value as DeviceType)} ${getDeviceTypeString(value as DeviceType)}`
      : field === 'mac'
        ? value
          ? Markdown.fixedWidth(value)
          : Markdown.italic('Отсутствует')
        : field === 'manufacturer'
          ? value === DeviceManufacturer.Other
            ? Markdown.italic('Неизвестно')
            : value
          : value;

  return Markdown.create`${ADD_DEVICE_FIELDS_INFO[field].icon} ${Markdown.bold(
    ADD_DEVICE_FIELDS_INFO[field].name,
  )}: ${formattedValue}`;
}

export function formatDevice(device: Device): Markdown {
  return formatDeviceFields(device, ['name', 'type']);
}

export function getBackToEditDeviceKeyboard(deviceId: number): InlineKeyboard {
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
