#!/bin/bash
# Deploy Datadog dashboards, monitors, and synthetics via API
#
# Prerequisites:
# - DD_API_KEY and DD_APP_KEY set in environment or .env file
# - jq installed
# - curl installed
#
# Usage:
#   ./deploy-datadog.sh [dashboards|monitors|synthetics|all]

set -e

# Load environment variables
if [ -f .env ]; then
    set -a
    # shellcheck source=/dev/null
    source .env
    set +a
fi

# Configuration
DD_SITE="${DD_SITE:-us5.datadoghq.com}"
API_BASE="https://api.${DD_SITE}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check required environment variables
check_env() {
    if [ -z "$DD_API_KEY" ]; then
        echo -e "${RED}ERROR: DD_API_KEY not set${NC}"
        echo "Get your API key from: https://${DD_SITE}/organization-settings/api-keys"
        exit 1
    fi

    if [ -z "$DD_APP_KEY" ]; then
        echo -e "${RED}ERROR: DD_APP_KEY not set${NC}"
        echo "Create an App Key at: https://${DD_SITE}/organization-settings/application-keys"
        exit 1
    fi

    echo -e "${GREEN}Using Datadog site: ${DD_SITE}${NC}"
}

# Validate API credentials
validate_credentials() {
    echo "Validating Datadog credentials..."
    response=$(curl -s -X GET "${API_BASE}/api/v1/validate" \
        -H "DD-API-KEY: ${DD_API_KEY}" \
        -H "DD-APPLICATION-KEY: ${DD_APP_KEY}")

    if echo "$response" | grep -q "valid"; then
        echo -e "${GREEN}Credentials valid${NC}"
    else
        echo -e "${RED}Invalid credentials: $response${NC}"
        exit 1
    fi
}

# Deploy dashboards
deploy_dashboards() {
    echo -e "\n${YELLOW}Deploying dashboards...${NC}"

    for file in "$SCRIPT_DIR"/dashboard-*.json; do
        if [ -f "$file" ]; then
            name=$(basename "$file" .json)
            echo "  Creating dashboard: $name"

            response=$(curl -s -X POST "${API_BASE}/api/v1/dashboard" \
                -H "Content-Type: application/json" \
                -H "DD-API-KEY: ${DD_API_KEY}" \
                -H "DD-APPLICATION-KEY: ${DD_APP_KEY}" \
                -d @"$file")

            if echo "$response" | grep -q '"id"'; then
                dashboard_id=$(echo "$response" | jq -r '.id')
                echo -e "    ${GREEN}Created: https://${DD_SITE}/dashboard/${dashboard_id}${NC}"
            else
                echo -e "    ${RED}Failed: $(echo "$response" | jq -r '.errors // .error // .')${NC}"
            fi
        fi
    done
}

# Deploy monitors
deploy_monitors() {
    echo -e "\n${YELLOW}Deploying monitors...${NC}"

    for file in "$SCRIPT_DIR"/monitors-*.json; do
        if [ -f "$file" ]; then
            category=$(basename "$file" .json | sed 's/monitors-//')
            echo "  Processing $category monitors..."

            # Extract each monitor from the array
            monitors=$(jq -c '.monitors[]' "$file")

            while IFS= read -r monitor; do
                name=$(echo "$monitor" | jq -r '.name')
                echo "    Creating monitor: $name"

                response=$(curl -s -X POST "${API_BASE}/api/v1/monitor" \
                    -H "Content-Type: application/json" \
                    -H "DD-API-KEY: ${DD_API_KEY}" \
                    -H "DD-APPLICATION-KEY: ${DD_APP_KEY}" \
                    -d "$monitor")

                if echo "$response" | grep -q '"id"'; then
                    monitor_id=$(echo "$response" | jq -r '.id')
                    echo -e "      ${GREEN}Created: ID ${monitor_id}${NC}"
                else
                    echo -e "      ${RED}Failed: $(echo "$response" | jq -r '.errors[0] // .error // .')${NC}"
                fi
            done <<< "$monitors"
        fi
    done
}

# Deploy synthetic tests
deploy_synthetics() {
    echo -e "\n${YELLOW}Deploying synthetic tests...${NC}"

    if [ -f "$SCRIPT_DIR/synthetics.json" ]; then
        synthetics=$(jq -c '.synthetics[]' "$SCRIPT_DIR/synthetics.json")

        while IFS= read -r synthetic; do
            name=$(echo "$synthetic" | jq -r '.name')
            echo "  Creating synthetic test: $name"

            response=$(curl -s -X POST "${API_BASE}/api/v1/synthetics/tests" \
                -H "Content-Type: application/json" \
                -H "DD-API-KEY: ${DD_API_KEY}" \
                -H "DD-APPLICATION-KEY: ${DD_APP_KEY}" \
                -d "$synthetic")

            if echo "$response" | grep -q '"public_id"'; then
                test_id=$(echo "$response" | jq -r '.public_id')
                echo -e "    ${GREEN}Created: https://${DD_SITE}/synthetics/details/${test_id}${NC}"
            else
                echo -e "    ${RED}Failed: $(echo "$response" | jq -r '.errors[0] // .error // .')${NC}"
            fi
        done <<< "$synthetics"
    fi
}

# Main
main() {
    check_env
    validate_credentials

    case "${1:-all}" in
        dashboards)
            deploy_dashboards
            ;;
        monitors)
            deploy_monitors
            ;;
        synthetics)
            deploy_synthetics
            ;;
        all)
            deploy_dashboards
            deploy_monitors
            deploy_synthetics
            ;;
        *)
            echo "Usage: $0 [dashboards|monitors|synthetics|all]"
            exit 1
            ;;
    esac

    echo -e "\n${GREEN}Deployment complete!${NC}"
    echo "View your Datadog dashboard at: https://${DD_SITE}/dashboard"
}

main "$@"
