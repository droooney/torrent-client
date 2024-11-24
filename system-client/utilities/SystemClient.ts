import os from 'node:os';

import isWsl from 'is-wsl';

import { SECOND } from 'constants/date';

import CustomError, { ErrorCode } from 'utilities/CustomError';
import { exec } from 'utilities/process';
import { delay } from 'utilities/promise';

interface CpuUsageInfo {
  process: number;
  os: number;
}

interface CpuUsageAllInfo {
  process: number;
  idle: number;
  total: number;
}

interface WifiNetworkInfo {
  ssid: string;
  password: string;
}

const DEFAULT_MEASURE_CPU_INTERVAL = 1000;

export default class SystemClient {
  async getCpuTemperature(): Promise<number> {
    const result = await exec('cat /sys/class/thermal/thermal_zone0/temp');

    return parseInt(result) / 1000;
  }

  async getCpuUsage(interval: number = DEFAULT_MEASURE_CPU_INTERVAL): Promise<CpuUsageInfo> {
    const startCpuInfo = this.measureCpuUsage();

    await delay(interval);

    const endCpuInfo = this.measureCpuUsage();

    return {
      process: (endCpuInfo.process - startCpuInfo.process) / (endCpuInfo.total - startCpuInfo.total),
      os: 1 - (endCpuInfo.idle - startCpuInfo.idle) / (endCpuInfo.total - startCpuInfo.total),
    };
  }

  getOsFreeMemory(): number {
    return os.freemem();
  }

  getOsTotalMemory(): number {
    return os.totalmem();
  }

  getOsUptime(): number {
    return os.uptime() * 1000;
  }

  getProcessUsedMemory(): number {
    return process.memoryUsage.rss();
  }

  getProcessUptime(): number {
    return process.uptime() * 1000;
  }

  getWifiNetworkInfo(): WifiNetworkInfo {
    const ssid = process.env.WIFI_SSID;
    const password = process.env.WIFI_PASSWORD;

    if (!ssid || password === undefined) {
      throw new CustomError(ErrorCode.WIFI_NETWORK_NOT_SET, 'WiFi-сеть не задана');
    }

    return {
      ssid,
      password,
    };
  }

  isWsl(): boolean {
    return isWsl;
  }

  private measureCpuUsage(): CpuUsageAllInfo {
    const processCpuUsage = process.cpuUsage();
    const cpus = os.cpus();
    let idleSum = 0;
    let totalSum = 0;

    cpus.forEach(({ times }) => {
      idleSum += times.idle;
      totalSum += times.user + times.nice + times.sys + times.idle + times.irq;
    });

    return {
      process: (processCpuUsage.user + processCpuUsage.system) / 1000,
      idle: idleSum,
      total: totalSum,
    };
  }

  scheduleProcessShutdown(): void {
    setTimeout(() => {
      process.exit(0);
    }, 5 * SECOND);
  }

  async scheduleSystemReboot(): Promise<void> {
    await exec('sudo shutdown -r 1');
  }
}
