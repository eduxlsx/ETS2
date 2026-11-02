/**
 * Endereços IPv4 da rede local, para acessar o painel de outro dispositivo.
 */
import os from 'node:os';
import { HOST, PORT } from '../util/paths.js';

export interface NetworkInfo {
  host: string;
  port: number;
  lanEnabled: boolean;
  urls: string[];
}

const VIRTUAL = /vethernet|virtualbox|vmware|hyper-v|wsl|docker|loopback|tailscale|zerotier|radmin|hamachi|vpn/i;

export function lanAddresses(): string[] {
  const out: { ip: string; virtual: boolean }[] = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) {
    for (const a of list ?? []) {
      if (a.family !== 'IPv4' || a.internal || a.address.startsWith('169.254.')) continue;
      out.push({ ip: a.address, virtual: VIRTUAL.test(name) });
    }
  }
  // adaptadores físicos (Wi-Fi/Ethernet) primeiro
  return out.sort((a, b) => Number(a.virtual) - Number(b.virtual)).map((a) => a.ip);
}

export function networkInfo(): NetworkInfo {
  const lanEnabled = HOST === '0.0.0.0' || HOST === '::';
  const ips = lanEnabled ? lanAddresses() : HOST === '127.0.0.1' || HOST === 'localhost' ? [] : [HOST];
  return { host: HOST, port: PORT, lanEnabled, urls: ips.map((ip) => `http://${ip}:${PORT}`) };
}

export function isLoopback(addr: string | undefined): boolean {
  return !!addr && (addr === '::1' || addr.startsWith('127.') || addr === '::ffff:127.0.0.1');
}
