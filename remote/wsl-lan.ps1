param(
  [Parameter(Mandatory = $true)][string]$LanAddress,
  [Parameter(Mandatory = $true)][string]$WslAddress,
  [Parameter(Mandatory = $true)][int]$Port
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$ruleName = 'XScrollRemoteWSL'
$registry = 'HKLM:\SYSTEM\CurrentControlSet\Services\PortProxy\v4tov4\tcp'
$mappingName = "$LanAddress/$Port"
$destination = "$WslAddress/$Port"
$newRule = $false

try {
  $address = Get-NetIPAddress -IPAddress $LanAddress -AddressFamily IPv4 | Select-Object -First 1
  $network = Get-NetConnectionProfile -InterfaceIndex $address.InterfaceIndex
  $category = if ($network.NetworkCategory -eq 'DomainAuthenticated') { 'Domain' } else { $network.NetworkCategory }
  $mappings = Get-Item -LiteralPath $registry -ErrorAction SilentlyContinue
  $existing = if ($mappings) { $mappings.GetValue($mappingName) }
  $wildcard = if ($mappings) { $mappings.GetValue("0.0.0.0/$Port") }
  $rule = Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue
  $binding = "XScroll WSL $mappingName"
  if ($wildcard -or ($existing -and $existing -ne $destination -and $rule.Description -ne $binding)) {
    throw "The Windows port is already forwarded by another application."
  }
  if ($rule -and $rule.Description -ne $binding) {
    throw "An XScroll firewall rule already exists for another Windows address."
  }

  $ruleOptions = @{
    Profile = $category
    InterfaceAlias = $address.InterfaceAlias
    LocalAddress = $LanAddress
    RemoteAddress = 'LocalSubnet'
    Protocol = 'TCP'
    LocalPort = $Port
    Direction = 'Inbound'
    Action = 'Allow'
    Enabled = 'True'
  }
  if (!$rule) {
    New-NetFirewallRule -Name $ruleName -DisplayName 'XScroll Remote (WSL)' -Description $binding @ruleOptions | Out-Null
    $newRule = $true
  } else {
    Set-NetFirewallRule -Name $ruleName @ruleOptions | Out-Null
  }

  if ($existing -ne $destination) {
    $action = if ($existing) { 'set' } else { 'add' }
    $result = & netsh interface portproxy $action v4tov4 "listenaddress=$LanAddress" "listenport=$Port" "connectaddress=$WslAddress" "connectport=$Port"
    $current = Get-Item -LiteralPath $registry -ErrorAction SilentlyContinue
    if ($LASTEXITCODE -ne 0 -or !$current -or $current.GetValue($mappingName) -ne $destination) {
      throw "Windows could not forward port $Port. $result"
    }
  }
  Write-Host "XScroll LAN is ready at http://${LanAddress}:${Port}/"
} catch {
  if ($newRule) { Remove-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue -ErrorVariable ignored }
  Write-Host $_.Exception.Message
  exit 1
}
