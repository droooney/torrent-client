import { Device, DeviceType } from '@prisma/client';

import prisma from 'db/prisma';
import { getPaginationInfo } from 'db/utilities/pagination';

import { AddDevicePayload, AddDevicePayloadField } from 'devices-client/types/device';
import { DevicesClientCallbackButtonSource } from 'telegram-bot/types/keyboard/devices-client';
import { RootCallbackButtonSource } from 'telegram-bot/types/keyboard/root';

import Markdown from 'telegram-bot/utilities/Markdown';
import {
  addCallbackButton,
  backCallbackButton,
  callbackButton,
  deleteCallbackButton,
  listCallbackButton,
  refreshCallbackButton,
} from 'telegram-bot/utilities/keyboard';
import ImmediateTextResponse from 'telegram-bot/utilities/response/ImmediateTextResponse';
import PaginationTextResponse from 'telegram-bot/utilities/response/PaginationTextResponse';
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

export async function getStatusResponse(): Promise<ImmediateTextResponse> {
  return new ImmediateTextResponse({
    text: Markdown.italic('Нет устройств онлайн'),
    keyboard: [
      [
        refreshCallbackButton({
          source: DevicesClientCallbackButtonSource.REFRESH_STATUS,
        }),
        addCallbackButton({
          source: DevicesClientCallbackButtonSource.ADD_DEVICE,
        }),
      ],
      [
        listCallbackButton({
          source: DevicesClientCallbackButtonSource.STATUS_SHOW_DEVICES_LIST,
        }),
      ],
      [
        backCallbackButton({
          source: RootCallbackButtonSource.BACK_TO_ROOT,
        }),
      ],
    ],
  });
}

export async function getDevicesListResponse(page: number = 0): Promise<PaginationTextResponse<Device>> {
  return new PaginationTextResponse({
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
      source: DevicesClientCallbackButtonSource.DEVICES_LIST_PAGE,
      page,
    }),
    getItemButton: (device) =>
      callbackButton(DEVICE_TYPE_ICON_MAP[device.type], device.name, {
        source: DevicesClientCallbackButtonSource.NAVIGATE_TO_DEVICE,
        deviceId: device.id,
      }),
    getItemText: (device) => formatDevice(device),
    getKeyboard: (paginationButtons) => [
      [
        refreshCallbackButton({
          source: DevicesClientCallbackButtonSource.DEVICES_LIST_REFRESH,
          page,
        }),
      ],
      ...paginationButtons,
      [
        backCallbackButton({
          source: DevicesClientCallbackButtonSource.BACK_TO_STATUS,
        }),
      ],
    ],
  });
}

export function getAddDeviceSetNameResponse(): ImmediateTextResponse {
  return new ImmediateTextResponse({
    text: Markdown.italic('Введите название устройства'),
    keyboard: [
      [
        callbackButton('◀️', 'К устройствам', {
          source: DevicesClientCallbackButtonSource.BACK_TO_STATUS,
        }),
      ],
    ],
  });
}

export function getAddDeviceSetTypeResponse(addDevicePayload: AddDevicePayload): ImmediateTextResponse {
  return new ImmediateTextResponse({
    text: Markdown.create`${formatEnteredFields(addDevicePayload, ['name'])}


${Markdown.italic('Выберите тип устройства')}`,
    keyboard: [
      [
        ...Object.values(DeviceType).map((type) =>
          callbackButton(DEVICE_TYPE_ICON_MAP[type], DEVICE_TYPE_NAME_MAP[type], {
            source: DevicesClientCallbackButtonSource.ADD_DEVICE_SET_TYPE,
            type,
          }),
        ),
      ],
      [
        callbackButton('◀️', 'К выбору названия', {
          source: DevicesClientCallbackButtonSource.ADD_DEVICE_BACK_TO_SET_NAME,
        }),
      ],
      [
        callbackButton('◀️', 'К устройствам', {
          source: DevicesClientCallbackButtonSource.BACK_TO_STATUS,
        }),
      ],
    ],
  });
}

export function getAddDeviceSetMacResponse(addDevicePayload: AddDevicePayload): ImmediateTextResponse {
  return new ImmediateTextResponse({
    text: Markdown.create`${formatEnteredFields(addDevicePayload, ['name', 'type'])}


${Markdown.italic('Введите MAC устройства')}`,
    keyboard: [
      [
        callbackButton('◀️', 'К выбору типа', {
          source: DevicesClientCallbackButtonSource.ADD_DEVICE_BACK_TO_SET_TYPE,
        }),
      ],
      [
        callbackButton('◀️', 'К устройствам', {
          source: DevicesClientCallbackButtonSource.BACK_TO_STATUS,
        }),
      ],
    ],
  });
}

export function getAddDeviceSetAddressResponse(addDevicePayload: AddDevicePayload): ImmediateTextResponse {
  return new ImmediateTextResponse({
    text: Markdown.create`${formatEnteredFields(addDevicePayload, ['name', 'type', 'mac'])}


${Markdown.italic('Введите адрес устройства')}`,
    keyboard: [
      [
        callbackButton('◀️', 'К вводу MAC', {
          source: DevicesClientCallbackButtonSource.ADD_DEVICE_BACK_TO_SET_MAC,
        }),
      ],
      [
        callbackButton('◀️', 'К устройствам', {
          source: DevicesClientCallbackButtonSource.BACK_TO_STATUS,
        }),
      ],
    ],
  });
}

export async function getDeviceResponse(
  deviceId: number,
  withDeleteConfirm: boolean = false,
): Promise<ImmediateTextResponse> {
  const device = await prisma.device.findUnique({
    where: {
      id: deviceId,
    },
  });

  if (!device) {
    throw new CustomError(ErrorCode.NOT_FOUND, 'Устройство не найдено');
  }

  return new ImmediateTextResponse({
    text: formatDeviceFields(device, ['name', 'type', 'mac', 'address']),
    keyboard: [
      [
        refreshCallbackButton({
          source: DevicesClientCallbackButtonSource.DEVICE_REFRESH,
          deviceId,
        }),
        deleteCallbackButton(
          withDeleteConfirm,
          {
            source: DevicesClientCallbackButtonSource.DEVICE_DELETE_CONFIRM,
            deviceId,
          },
          {
            source: DevicesClientCallbackButtonSource.DEVICE_DELETE,
            deviceId,
          },
        ),
      ],
      [
        callbackButton('◀️', 'К списку', {
          source: DevicesClientCallbackButtonSource.BACK_TO_DEVICES_LIST,
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
