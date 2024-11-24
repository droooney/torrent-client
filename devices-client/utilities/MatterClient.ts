import { Environment, LogLevel, Logger, NodeId, singleton } from '@matter/main';
import { OnOff } from '@matter/main/clusters';
import { NodeJsBle } from '@matter/nodejs-ble';
import { Ble, ClusterClientObj } from '@matter/protocol';
import { CommissioningController } from '@project-chip/matter.js';
import { PairedNode } from '@project-chip/matter.js/device';
import systemClient from 'system-client/client';

import { MINUTE } from 'constants/date';

import { ManualPairingCodeCodec, ManualPairingData } from '@matter/types';

import CustomError, { ErrorCode } from 'utilities/CustomError';
import { poll } from 'utilities/process';
import { timed } from 'utilities/promise';

export type NodePower = boolean | 'unknown';

export type NodeState = {
  power: NodePower;
};

export default class MatterClient {
  static parsePairingCode(pairingCode: string): ManualPairingData {
    return ManualPairingCodeCodec.decode(pairingCode);
  }

  private readonly _commissioningControllerPromise: Promise<CommissioningController>;

  constructor() {
    this._commissioningControllerPromise = (async () => {
      const environment = Environment.default;

      Logger.level = LogLevel.WARN;

      Ble.get = singleton(() => new NodeJsBle());

      const commissioningController = new CommissioningController({
        environment: {
          environment,
          id: 'smart-home',
        },
        autoConnect: false,
      });

      await commissioningController.start();

      return commissioningController;
    })();
  }

  async commissionDevice(pairingCode: string): Promise<NodeId> {
    const commissioningController = await this.getCommissioningController();
    const pairingData = MatterClient.parsePairingCode(pairingCode);
    const wifiNetworkInfo = systemClient.getWifiNetworkInfo();
    const discoveryCapabilities = {
      ble: true,
      onIpNetwork: true,
    };

    try {
      const nodeId = await timed(MINUTE, async () =>
        commissioningController.commissionNode(
          {
            commissioning: {
              wifiNetwork: {
                wifiSsid: wifiNetworkInfo.ssid,
                wifiCredentials: wifiNetworkInfo.password,
              },
            },
            discovery: {
              identifierData: pairingData,
              discoveryCapabilities,
              timeoutSeconds: 5,
            },
            passcode: pairingData.passcode,
          },
          false,
        ),
      );

      if (!nodeId) {
        throw new CustomError(ErrorCode.TIMEOUT, 'Подключение к устройству заняло слишком долго');
      }

      return nodeId;
    } catch (err) {
      commissioningController.cancelCommissionableDeviceDiscovery(pairingData, discoveryCapabilities);

      throw err;
    }
  }

  private async getCommissioningController(): Promise<CommissioningController> {
    return await this._commissioningControllerPromise;
  }

  async getNodeState(nodeId: bigint): Promise<NodeState> {
    return {
      power: await this.getPower(nodeId),
    };
  }

  private async getOnOff(nodeId: bigint): Promise<ClusterClientObj<OnOff.Complete> | null> {
    return (
      (await this.getPairedNode(nodeId))
        .getDevices()
        .find((device) => device.name === 'MA-onoffpluginunit')
        ?.getClusterClient(OnOff.Complete) ?? null
    );
  }

  async getPairedNode(nodeId: bigint): Promise<PairedNode> {
    const commissioningController = await this.getCommissioningController();
    const branded = NodeId(nodeId);

    return commissioningController.getPairedNode(branded) ?? (await commissioningController.connectNode(branded));
  }

  async getPower(nodeId: bigint): Promise<NodePower> {
    const onOff = await this.getOnOff(nodeId);

    return onOff ? await onOff.getOnOffAttribute() : 'unknown';
  }

  async removeNode(nodeId: bigint): Promise<void> {
    const commissioningController = await this.getCommissioningController();
    const branded = NodeId(nodeId);

    try {
      await commissioningController.disconnectNode(branded);
    } catch {
      /* empty */
    }

    try {
      const pairedNode = commissioningController.getPairedNode(branded);

      await pairedNode?.decommission();
    } catch (err) {
      try {
        await commissioningController.removeNode(branded);
      } catch {
        /* empty */
      }
    }
  }

  async turnOffNode(nodeId: bigint): Promise<void> {
    const onOff = await this.getOnOff(nodeId);

    await onOff?.off();

    await poll(100, async () => (await this.getPower(nodeId)) === false);
  }

  async turnOnNode(nodeId: bigint): Promise<void> {
    const onOff = await this.getOnOff(nodeId);

    await onOff?.on();

    await poll(100, async () => (await this.getPower(nodeId)) === true);
  }
}
