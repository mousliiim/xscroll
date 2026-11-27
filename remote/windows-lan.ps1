param(
  [Parameter(Mandatory = $true)][string]$LanAddress,
  [string]$WslAddress,
  [Parameter(Mandatory = $true)][int]$Port,
  [switch]$RefreshProxy,
  [string]$ResultPath
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$platform = if ($WslAddress) { 'WSL' } else { 'Windows' }
$ruleName = "XScrollRemote$platform"
if ($Port -ne 4781) { $ruleName += "-$Port" }
$registry = 'HKLM:\SYSTEM\CurrentControlSet\Services\PortProxy\v4tov4\tcp'
$mappingName = "$LanAddress/$Port"
$binding = "XScroll $platform $mappingName"
$destination = "$WslAddress/$Port"
$changedProxy = $false

function Test-LanListener {
  return [bool](Get-NetTCPConnection -LocalAddress $LanAddress -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Set-Proxy($action, $target) {
  $result = & netsh interface portproxy $action v4tov4 "listenaddress=$LanAddress" "listenport=$Port" "connectaddress=$target" "connectport=$Port"
  $current = Get-Item -LiteralPath $registry -ErrorAction SilentlyContinue
  if ($LASTEXITCODE -ne 0 -or !$current -or $current.GetValue($mappingName) -ne "$target/$Port") {
    throw "Windows could not forward TCP port $Port. $result"
  }
}

try {
  $address = Get-NetIPAddress -IPAddress $LanAddress -AddressFamily IPv4 | Select-Object -First 1
  $rule = Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue
  $previousAddress = $null
  if ($rule) {
    if ($rule.Description -notmatch "^XScroll $platform (?<ip>[0-9.]+)/$Port$") {
      throw "The Windows firewall rule name $ruleName is already in use."
    }
    $previousAddress = $Matches.ip
  }

  if ($WslAddress) {
    $mappings = Get-Item -LiteralPath $registry -ErrorAction SilentlyContinue
    $existing = if ($mappings) { $mappings.GetValue($mappingName) }
    $wildcard = if ($mappings) { $mappings.GetValue("0.0.0.0/$Port") }
    if ($wildcard -or ($existing -and $previousAddress -ne $LanAddress)) {
      throw "TCP port $Port is already forwarded by another Windows rule."
    }

    if ($existing -and ($RefreshProxy -or !(Test-LanListener))) {
      # Windows can keep a PortProxy entry across a reboot without reopening its listener.
      $result = & netsh interface portproxy delete v4tov4 "listenaddress=$LanAddress" "listenport=$Port"
      if ($LASTEXITCODE -ne 0) { throw "Windows could not refresh the XScroll forwarding rule. $result" }
      $changedProxy = $true
      Set-Proxy add $WslAddress
    } elseif ($existing -ne $destination) {
      $changedProxy = $true
      $action = if ($existing) { 'set' } else { 'add' }
      Set-Proxy $action $WslAddress
    }

    for ($attempt = 0; $attempt -lt 10 -and !(Test-LanListener); $attempt++) {
      Start-Sleep -Milliseconds 250
    }
    if (!(Test-LanListener)) { throw "Windows is not listening on ${LanAddress}:${Port}." }
  }

  $ruleOptions = @{
    Description = $binding
    Profile = 'Any'
    InterfaceAlias = $address.InterfaceAlias
    LocalAddress = $LanAddress
    RemoteAddress = 'LocalSubnet'
    Protocol = 'TCP'
    LocalPort = $Port
    Direction = 'Inbound'
    Action = 'Allow'
    Enabled = 'True'
  }
  if ($rule) {
    Set-NetFirewallRule -Name $ruleName @ruleOptions | Out-Null
  } else {
    New-NetFirewallRule -Name $ruleName -DisplayName "XScroll Remote ($platform)" @ruleOptions | Out-Null
  }

  if ($WslAddress -and $previousAddress -and $previousAddress -ne $LanAddress -and
      $mappings -and $mappings.GetValue("$previousAddress/$Port")) {
    & netsh interface portproxy delete v4tov4 "listenaddress=$previousAddress" "listenport=$Port" | Out-Null
  }
} catch {
  $message = $_.Exception.Message
  if ($changedProxy) {
    $current = Get-Item -LiteralPath $registry -ErrorAction SilentlyContinue
    $configured = $current -and $current.GetValue($mappingName)
    if ($existing) {
      $action = if ($configured) { 'set' } else { 'add' }
      & netsh interface portproxy $action v4tov4 "listenaddress=$LanAddress" "listenport=$Port" "connectaddress=$($existing.Split('/')[0])" "connectport=$Port" | Out-Null
    } elseif ($configured) {
      & netsh interface portproxy delete v4tov4 "listenaddress=$LanAddress" "listenport=$Port" | Out-Null
    }
  }
  if ($ResultPath) { [IO.File]::WriteAllText($ResultPath, $message) }
  Write-Host $message
  exit 1
}
