import { execFile, execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import { isIPv4 } from 'node:net';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const encode = command => Buffer.from(command, 'utf16le').toString('base64');
const powershellArgs = command => ['-NoProfile', '-NonInteractive', '-EncodedCommand', encode(command)];

export function windowsLan(isLocal, port) {
  const wsl = process.platform === 'linux' && os.release().toLowerCase().includes('wsl2');
  if (!wsl && process.platform !== 'win32') return null;
  if (wsl) {
    const mode = spawnSync('wslinfo', ['--networking-mode'], { encoding: 'utf8', timeout: 2000 }).stdout?.trim();
    if (mode === 'none') return { wsl };
    if (mode && !['nat', 'virtioproxy', 'consomme'].includes(mode)) return null;
  }

  let config;
  try {
    const command = `
      $ProgressPreference = 'SilentlyContinue'
      $adapters = Get-NetIPConfiguration | Where-Object {
        $_.NetAdapter.Status -eq 'Up' -and $_.NetAdapter.HardwareInterface
      } | Sort-Object @{Expression = { !$_.IPv4DefaultGateway }}, { $_.NetIPv4Interface.InterfaceMetric }
      $rule = Get-NetFirewallRule -Name '${wsl ? 'XScrollRemoteWSL' : 'XScrollRemoteWindows'}${port === 4781 ? '' : `-${port}`}' -PolicyStore ActiveStore -ErrorAction SilentlyContinue
      $ready = $rule.Enabled -eq 'True' -and $rule.Profile -eq 'Any' -and $rule.Action -eq 'Allow' -and $rule.Direction -eq 'Inbound'
      @{
        addresses = @($adapters | ForEach-Object { $_.IPv4Address.IPAddress })
        binding = if ($ready) { $rule.Description } else { '' }
      } | ConvertTo-Json -Compress
    `;
    config = JSON.parse(execFileSync('powershell.exe', powershellArgs(command), {
      encoding: 'utf8', timeout: 10000, stdio: ['ignore', 'pipe', 'ignore'],
    }));
  } catch { return { wsl }; }
  const windows = config.addresses.find(isLocal);
  if (!windows) return { wsl };
  const firewallReady = config.binding === `XScroll ${wsl ? 'WSL' : 'Windows'} ${windows}/${port}`;
  if (!wsl) return { windows, wsl, firewallReady };

  const route = spawnSync('ip', ['-4', 'route', 'get', windows], { encoding: 'utf8', timeout: 2000 }).stdout;
  const source = route?.match(/\bsrc\s+(\S+)/)?.[1];
  const guest = isLocal(source) ? source : os.networkInterfaces().eth0?.find(entry => isLocal(entry.address))?.address;
  return { windows, guest, wsl, firewallReady };
}

export async function configureWindowsLan(route, port, { refreshProxy = false } = {}) {
  if (!isIPv4(route.windows) || (route.wsl && !isIPv4(route.guest)) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Adresse réseau Windows ou IPv4 WSL introuvable.');
  }
  const script = readFileSync(new URL('windows-lan.ps1', import.meta.url), 'utf8');
  const command = `& { ${script} } -LanAddress '${route.windows}' -WslAddress '${route.guest || ''}' -Port ${port} -ResultPath $resultPath${refreshProxy ? ' -RefreshProxy' : ''}`;
  try {
    await execFileAsync('powershell.exe', powershellArgs(`
    $ErrorActionPreference = 'Stop'
    [Console]::OutputEncoding = [Text.Encoding]::UTF8
    $result = [System.IO.Path]::GetTempFileName()
    try {
      $command = '$resultPath = ''' + $result.Replace("'", "''") + "'" + [Environment]::NewLine + @'
${command}
'@
      $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($command))
      $config = Start-Process -FilePath "$PSHOME\\powershell.exe" -Verb RunAs -Wait -PassThru -ArgumentList '-NoProfile', '-NonInteractive', '-EncodedCommand', $encoded
      if ($config.ExitCode -ne 0) {
        [Console]::Out.Write([IO.File]::ReadAllText($result))
        exit $config.ExitCode
      }
    } finally {
      Remove-Item -LiteralPath $result -ErrorAction SilentlyContinue
    }
    `));
  } catch (error) {
    if (error.stdout?.trim()) throw new Error(error.stdout.trim());
    throw new Error('La configuration Windows a échoué. Vérifie que tu as accepté la demande administrateur.');
  }
}
