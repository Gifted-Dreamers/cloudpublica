#!/bin/bash
# Create New Relic synthetic monitors for Common Cloud apps (docs/HOSTED-APPS.md).
# Requires: NR_KEY (New Relic API key).
# Region: EU (synthetics.eu.newrelic.com).
#
# Usage: NR_KEY="your-new-relic-api-key" bash 05-monitoring/scripts/create-newrelic-monitors.sh

set -e

NR_KEY="${NR_KEY:?Set NR_KEY (e.g. from 1Password user_key)}"
API="https://synthetics.eu.newrelic.com/synthetics/api/v1/monitors"
LOCATIONS='["AWS_EU_WEST_1","AWS_US_EAST_1","AWS_US_WEST_1"]'

# name|uri (one per line)
MONITORS="
Gifted Dreamers|https://gifteddreamers.org/
Anytype|https://anytype.cloudpublica.org/
Snikket|https://snikket.cloudpublica.org/
AppFlowy Cloud|https://appflowy.cloudpublica.org/
Nextcloud|https://cloud.commoncloud.cc/status.php
Vaultwarden|https://vault.commoncloud.cc/alive
Matrix Synapse|https://matrix.commoncloud.cc/_matrix/client/versions
Element|https://element.commoncloud.cc/
Jitsi Meet|https://meet.commoncloud.cc/
Collabora Online|https://office.commoncloud.cc/healthcheck
CryptPad|https://pad.commoncloud.cc/
AdGuard Home|https://guard.commoncloud.cc/
WireGuard VPN|https://vpn.commoncloud.cc/
Syncthing|https://sync.commoncloud.cc/
Mosquitto mesh|https://mesh.commoncloud.cc/
Facilmap|https://maps.commoncloud.cc/
LinkStack|https://links.commoncloud.cc/
Kiwix|https://library.commoncloud.cc/
"

echo "Creating New Relic synthetic monitors (EU)..."
while IFS='|' read -r name uri; do
  [ -z "$name" ] && continue
  uri=$(echo "$uri" | tr -d '[:space:]')
  [ -z "$uri" ] && continue
  echo "  $name -> $uri"
  http_code=$(curl -s -o /tmp/nr_resp.json -w "%{http_code}" -X POST "$API" \
    -H "Api-Key: $NR_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$name\",\"type\":\"SIMPLE\",\"frequency\":5,\"uri\":\"$uri\",\"locations\":$LOCATIONS,\"status\":\"ENABLED\",\"slaThreshold\":7.0}")
  if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
    id=$(jq -r '.id // empty' /tmp/nr_resp.json 2>/dev/null); echo "    Created: ${id:-$http_code}"
  else
    echo "    Failed (HTTP $http_code): $(jq -r '.error // .message // .' /tmp/nr_resp.json 2>/dev/null || cat /tmp/nr_resp.json)"
  fi
done <<< "$MONITORS"
echo "Done. List monitors: curl -s -X GET $API -H \"Api-Key: \$NR_KEY\" -H \"Content-Type: application/json\" | jq '.monitors[] | {id, name, uri}'"
