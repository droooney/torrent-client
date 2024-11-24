import { Environment, LogLevel, Logger, NodeId, singleton } from '@matter/main';
import { OnOff } from '@matter/main/clusters';
import { NodeJsBle } from '@matter/nodejs-ble';
import { Ble, ClusterClientObj } from '@matter/protocol';
import { CommissioningController } from '@project-chip/matter.js';
import { PairedNode } from '@project-chip/matter.js/device';
import systemClient from 'system-client/client';

import { MINUTE } from 'constants/date';

import { ManualPairingCodeCodec, ManualPairingData } from '@matter/types';

import { isIp } from 'devices-client/utilities/is';
import CustomError, { ErrorCode } from 'utilities/CustomError';
import { poll } from 'utilities/process';
import { timed } from 'utilities/promise';

export type NodePower = boolean | 'unknown';

export type NodeState = {
  power: NodePower;
};

export type CommissionedNodeInfo = {
  nodeId: bigint;
  address: string | null;
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

  async commissionDevice(pairingCode: string): Promise<CommissionedNodeInfo> {
    const commissioningController = await this.getCommissioningController();
    const pairingData = MatterClient.parsePairingCode(pairingCode);
    const wifiNetworkInfo = systemClient.getWifiNetworkInfo();
    const discoveryCapabilities = {
      ble: true,
      onIpNetwork: true,
    };
    let nodeId: NodeId | null = null;

    try {
      nodeId = await timed(MINUTE, async () =>
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

      const commissionedNodeDetails = commissioningController
        .getCommissionedNodesDetails()
        .find((details) => details.nodeId === nodeId);
      let address: string | null = null;

      try {
        if (commissionedNodeDetails?.operationalAddress) {
          const url = new URL(commissionedNodeDetails.operationalAddress);

          if (isIp(url.hostname)) {
            address = url.hostname;
          }
        }
      } catch {
        /* empty */
      }

      return {
        nodeId,
        address,
      };
    } catch (err) {
      commissioningController.cancelCommissionableDeviceDiscovery(pairingData, discoveryCapabilities);

      if (nodeId) {
        await this.removeNode(nodeId);
      }

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
    const node = commissioningController.getPairedNode(branded) ?? (await commissioningController.connectNode(branded));

    if (!node.initialized) {
      await node.events.initialized;
    }

    return node;
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
      await commissioningController.getPairedNode(branded)?.decommission();
    } catch (err) {
      try {
        await commissioningController.removeNode(branded);
      } catch {
        /* empty */
      }
    }
  }

  async toggle(nodeId: bigint): Promise<void> {
    await (await this.getOnOff(nodeId))?.toggle();
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
