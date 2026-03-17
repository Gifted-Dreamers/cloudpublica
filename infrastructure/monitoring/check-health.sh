#!/bin/bash
# Common Cloud Health Check Script
# See 05-monitoring/HEALTH-CHECKS.md. List aligned with docs/HOSTED-APPS.md.

set -e

SERVICES=(
  # Docker Server (cloudpublica.org - 3.232.111.51)
  "Gifted Dreamers|https://gifteddreamers.org/"
  "Appsmith|https://hq.cloudpublica.org/api/v1/health"
  "n8n|https://n8n.cloudpublica.org/healthz"
  "Statamic|https://base.cloudpublica.org/"
  "VVVeb|https://vvveb.cloudpublica.org/"
  "Splunk|https://logs.cloudpublica.org/"
  "Anytype|https://anytype.cloudpublica.org/"
  "Snikket|https://snikket.cloudpublica.org/"
  "AppFlowy Cloud|https://appflowy.cloudpublica.org/"
  # YunoHost Server (commoncloud.cc - 34.200.128.26)
  "CommonCloud|https://commoncloud.cc/"
  "Nextcloud|https://cloud.commoncloud.cc/status.php"
  "Vaultwarden|https://vault.commoncloud.cc/alive"
  "Matrix|https://matrix.commoncloud.cc/_matrix/client/versions"
  "Element|https://element.commoncloud.cc/"
  "Jitsi|https://meet.commoncloud.cc/"
  "Collabora Online|https://office.commoncloud.cc/healthcheck"
  "CryptPad|https://pad.commoncloud.cc/"
  "AdGuard Home|https://guard.commoncloud.cc/"
  "WireGuard|https://vpn.commoncloud.cc/"
  "Syncthing|https://sync.commoncloud.cc/"
  "Mosquitto|https://mesh.commoncloud.cc/"
  "Facilmap|https://maps.commoncloud.cc/"
  "LinkStack|https://links.commoncloud.cc/"
  "Kiwix|https://library.commoncloud.cc/"
)

TOR_PORTS=(
  "Tor-ORPort|34.200.128.26|9002"
  "Tor-obfs4|34.200.128.26|9003"
)

echo "Common Cloud Health Check - $(date)"
echo "=================================="

for service in "${SERVICES[@]}"; do
  name="${service%%|*}"
  url="${service##*|}"
  if curl -sf -L "$url" -o /dev/null --max-time 10; then
    echo "✓ $name: OK"
  else
    echo "✗ $name: FAILED"
  fi
done

echo ""
echo "=== Tor Port Checks (YunoHost VM) ==="
for port_check in "${TOR_PORTS[@]}"; do
  IFS='|' read -r name host port <<< "$port_check"
  if nc -z -w5 "$host" "$port" 2>/dev/null; then
    echo "✓ $name ($host:$port): OK"
  else
    echo "✗ $name ($host:$port): FAILED"
  fi
done
