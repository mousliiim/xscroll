import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import { isIPv4 } from 'node:net';

const windowsAddressCommand = `
$ProgressPreference = 'SilentlyContinue'
Get-NetIPConfiguration | Where-Object {
  $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' -and $_.NetAdapter.HardwareInterface
} | Sort-Object { $_.NetIPv4Interface.InterfaceMetric } | ForEach-Object { $_.IPv4Address.IPAddress }
`;

function powershell(command, options = {}) {
  const encoded = Buffer.from(command, 'utf16le').toString('base64');
  return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded],
    { encoding: 'utf8', ...options });
}

export function wslLan(isLocal) {
  if (process.platform !== 'linux' || !os.release().toLowerCase().includes('wsl2')) return null;
  const mode = spawnSync('wslinfo', ['--networking-mode'], { encoding: 'utf8', timeout: 2000 }).stdout?.trim();
  if (mode && mode !== 'nat') return null;

  const guest = os.networkInterfaces().eth0?.find(entry => entry.family === 'IPv4' && isLocal(entry.address))?.address;
  try {
    const windows = powershell(windowsAddressCommand, { timeout: 10000, stdio: ['ignore', 'pipe', 'ignore'] }).split(/\s+/).find(isLocal);
    return { windows, guest };
  } catch {
    return { guest };
  }
}

export function configureWslLan(route, port) {
  if (!isIPv4(route?.windows || '') || !isIPv4(route?.guest || '') || !Number.isInteger(port)) {
    throw new Error('Adresse réseau Windows ou IPv4 WSL introuvable.');
  }
  const script = readFileSync(new URL('wsl-lan.ps1', import.meta.url), 'utf8');
  const command = `& { ${script} } -LanAddress '${route.windows}' -WslAddress '${route.guest}' -Port ${port}`;
  const encoded = Buffer.from(command, 'utf16le').toString('base64');
  try {
    powershell(`
    $ErrorActionPreference = 'Stop'
    $config = Start-Process -FilePath "$PSHOME\\powershell.exe" -Verb RunAs -Wait -PassThru `
    + `-ArgumentList '-NoProfile', '-NonInteractive', '-EncodedCommand', '${encoded}'
    exit $config.ExitCode
    `, { stdio: 'inherit' });
  } catch {
    throw new Error('La configuration Windows a échoué. Vérifie que tu as accepté la demande administrateur.');
  }
}
