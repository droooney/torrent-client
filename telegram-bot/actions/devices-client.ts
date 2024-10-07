import { Device, DeviceManufacturer, DeviceType } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';
import devicesClient from 'devices-client/client';

import { getPaginationInfo } from 'db/utilities/pagination';

import { AddDevicePayload, AddDevicePayloadField } from 'devices-client/types/device';
import { MessageAction } from 'telegram-bot/types/actions';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';
import { RootCallbackButtonType } from 'telegram-bot/types/keyboard/root';

import PaginationMessageAction from 'telegram-bot/utilities/actions/PaginationMessageAction';
import {
  addCallbackButton,
  backCallbackButton,
  callbackButton,
  deleteCallbackButton,
  listCallbackButton,
  refreshCallbackButton,
} from 'telegram-bot/utilities/keyboard';

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

export async function getStatusAction(): Promise<MessageAction> {
  return new MessageAction({
    content: {
      type: 'text',
      text: Markdown.italic('Нет устройств онлайн'),
    },
    replyMarkup: [
      [
        refreshCallbackButton({
          type: DevicesClientCallbackButtonType.RefreshStatus,
        }),
        addCallbackButton({
          type: DevicesClientCallbackButtonType.AddDevice,
        }),
      ],
      [
        listCallbackButton({
          type: DevicesClientCallbackButtonType.StatusShowDevicesList,
        }),
      ],
      [
        backCallbackButton({
          type: RootCallbackButtonType.BackToRoot,
        }),
      ],
    ],
  });
}

export async function getDevicesListAction(page: number = 0): Promise<PaginationMessageAction<Device>> {
  return new PaginationMessageAction({
    page,
    emptyPageText: Markdown.italic('Нет устройств'),
    getPageItemsInfo: async (options) =>
      getPaginationInfo({
        table: 'device',
        findOptions: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        pagination: options,
      }),
    getPageButtonCallbackData: (page) => ({
      type: DevicesClientCallbackButtonType.DevicesListPage,
      page,
    }),
    getItemButton: (device) =>
      callbackButton(DEVICE_TYPE_ICON_MAP[device.type], device.name, {
        type: DevicesClientCallbackButtonType.NavigateToDevice,
        deviceId: device.id,
      }),
    getItemText: (device) => formatDevice(device),
    getKeyboard: (paginationButtons) => [
      [
        refreshCallbackButton({
          type: DevicesClientCallbackButtonType.DevicesListRefresh,
          page,
        }),
      ],
      ...paginationButtons,
      [
        backCallbackButton({
          type: DevicesClientCallbackButtonType.BackToStatus,
        }),
      ],
    ],
  });
}

export function getAddDeviceSetNameAction(): MessageAction {
  return new MessageAction({
    content: {
      type: 'text',
      text: Markdown.italic('Введите название устройства'),
    },
    replyMarkup: [
      [
        callbackButton('◀️', 'К устройствам', {
          type: DevicesClientCallbackButtonType.BackToStatus,
        }),
      ],
    ],
  });
}

export function getAddDeviceSetTypeAction(addDevicePayload: AddDevicePayload): MessageAction {
  return new MessageAction({
    content: {
      type: 'text',
      text: Markdown.create`${formatEnteredFields(addDevicePayload, ['name'])}


${Markdown.italic('Выберите тип устройства')}`,
    },
    replyMarkup: [
      [
        ...Object.values(DeviceType)
          .filter((type) => type !== DeviceType.Other)
          .map((deviceType) =>
            callbackButton(DEVICE_TYPE_ICON_MAP[deviceType], DEVICE_TYPE_NAME_MAP[deviceType], {
              type: DevicesClientCallbackButtonType.AddDeviceSetType,
              deviceType,
            }),
          ),
      ],
      [
        callbackButton('◀️', 'К выбору названия', {
          type: DevicesClientCallbackButtonType.AddDeviceBackToSetName,
        }),
      ],
      [
        callbackButton('◀️', 'К устройствам', {
          type: DevicesClientCallbackButtonType.BackToStatus,
        }),
      ],
    ],
  });
}

export function getAddDeviceSetManufacturerAction(addDevicePayload: AddDevicePayload): MessageAction {
  return new MessageAction({
    content: {
      type: 'text',
      text: Markdown.create`${formatEnteredFields(addDevicePayload, ['name', 'type'])}


${Markdown.italic('Выберите производителя устройства')}`,
    },
    replyMarkup: [
      [
        ...Object.values(DeviceManufacturer).map((manufacturer) =>
          callbackButton('', manufacturer === DeviceType.Other ? 'Другой' : manufacturer, {
            type: DevicesClientCallbackButtonType.AddDeviceSetManufacturer,
            manufacturer,
          }),
        ),
      ],
      [
        callbackButton('◀️', 'К выбору типа', {
          type: DevicesClientCallbackButtonType.AddDeviceBackToSetType,
        }),
      ],
      [
        callbackButton('◀️', 'К устройствам', {
          type: DevicesClientCallbackButtonType.BackToStatus,
        }),
      ],
    ],
  });
}

export function getAddDeviceSetMacAction(addDevicePayload: AddDevicePayload): MessageAction {
  return new MessageAction({
    content: {
      type: 'text',
      text: Markdown.create`${formatEnteredFields(addDevicePayload, ['name', 'type', 'manufacturer'])}


${Markdown.italic('Введите MAC устройства. Вбейте "-", чтобы пропустить')}`,
    },
    replyMarkup: [
      [
        callbackButton('◀️', 'К выбору производителя', {
          type: DevicesClientCallbackButtonType.AddDeviceBackToSetManufacturer,
        }),
      ],
      [
        callbackButton('◀️', 'К устройствам', {
          type: DevicesClientCallbackButtonType.BackToStatus,
        }),
      ],
    ],
  });
}

export function getAddDeviceSetAddressAction(addDevicePayload: AddDevicePayload): MessageAction {
  return new MessageAction({
    content: {
      type: 'text',
      text: Markdown.create`${formatEnteredFields(addDevicePayload, ['name', 'type', 'manufacturer', 'mac'])}


${Markdown.italic('Введите адрес устройства')}`,
    },
    replyMarkup: [
      [
        callbackButton('◀️', 'К вводу MAC', {
          type: DevicesClientCallbackButtonType.AddDeviceBackToSetMac,
        }),
      ],
      [
        callbackButton('◀️', 'К устройствам', {
          type: DevicesClientCallbackButtonType.BackToStatus,
        }),
      ],
    ],
  });
}

export async function getDeviceAction(deviceId: number, withDeleteConfirm: boolean = false): Promise<MessageAction> {
  const deviceInfo = await devicesClient.getDeviceInfo(deviceId);
  const { state: deviceState } = deviceInfo;

  return new MessageAction({
    content: {
      type: 'text',
      text: Markdown.create`${formatDeviceFields(deviceInfo, ['name', 'type', 'manufacturer', 'mac', 'address'])}

${Markdown.bold('⚡ Питание:')} ${
        deviceState.power === 'unknown'
          ? Markdown.italic('Неизвестно')
          : deviceState.power
            ? '🟢 Включено'
            : '🔴 Выключено'
      }`,
    },
    replyMarkup: [
      [
        refreshCallbackButton({
          type: DevicesClientCallbackButtonType.DeviceRefresh,
          deviceId,
        }),
        deleteCallbackButton(
          withDeleteConfirm,
          {
            type: DevicesClientCallbackButtonType.DeviceDeleteConfirm,
            deviceId,
          },
          {
            type: DevicesClientCallbackButtonType.DeviceDelete,
            deviceId,
          },
        ),
      ],
      [
        deviceState.power === true
          ? callbackButton('🔴', 'Выключить', {
              type: DevicesClientCallbackButtonType.DeviceTurnOff,
              deviceId,
            })
          : callbackButton('🟢', 'Включить', {
              type: DevicesClientCallbackButtonType.DeviceTurnOn,
              deviceId,
            }),
      ],
      [
        callbackButton('◀️', 'К списку', {
          type: DevicesClientCallbackButtonType.BackToDevicesList,
        }),
      ],
    ],
  });
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
      ? Markdown.create`${DEVICE_TYPE_ICON_MAP[value as DeviceType]} ${DEVICE_TYPE_NAME_MAP[value as DeviceType]}`
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
