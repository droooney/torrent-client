import { Device, DeviceType } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';

import prisma from 'db/prisma';
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
import CustomError, { ErrorCode } from 'utilities/CustomError';

const ADD_DEVICE_FIELDS_INFO: Record<AddDevicePayloadField, { icon: string; name: string }> = {
  name: {
    icon: '🅰️',
    name: 'Название',
  },
  type: {
    icon: '🔤',
    name: 'Тип',
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
};

const DEVICE_TYPE_NAME_MAP: Record<DeviceType, string> = {
  [DeviceType.Tv]: 'Телевизор',
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
        ...Object.values(DeviceType).map((deviceType) =>
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

export function getAddDeviceSetMacAction(addDevicePayload: AddDevicePayload): MessageAction {
  return new MessageAction({
    content: {
      type: 'text',
      text: Markdown.create`${formatEnteredFields(addDevicePayload, ['name', 'type'])}


${Markdown.italic('Введите MAC устройства')}`,
    },
    replyMarkup: [
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

export function getAddDeviceSetAddressAction(addDevicePayload: AddDevicePayload): MessageAction {
  return new MessageAction({
    content: {
      type: 'text',
      text: Markdown.create`${formatEnteredFields(addDevicePayload, ['name', 'type', 'mac'])}


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
  const device = await prisma.device.findUnique({
    where: {
      id: deviceId,
    },
  });

  if (!device) {
    throw new CustomError(ErrorCode.NOT_FOUND, 'Устройство не найдено');
  }

  return new MessageAction({
    content: {
      type: 'text',
      text: formatDeviceFields(device, ['name', 'type', 'mac', 'address']),
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
        callbackButton('🟢', 'Включить', {
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
        ? Markdown.fixedWidth(value)
        : value;

  return Markdown.create`${ADD_DEVICE_FIELDS_INFO[field].icon} ${Markdown.bold(
    ADD_DEVICE_FIELDS_INFO[field].name,
  )}: ${formattedValue}`;
}

export function formatDevice(device: Device): Markdown {
  return formatDeviceFields(device, ['name', 'type']);
}
