#!/bin/bash
# ===========================================
# Generate Secure Keys for Common Cloud
# ===========================================
# Run this script to generate secure random keys
#
# Usage:
#   ./generate-keys.sh          # Print keys to console
#   ./generate-keys.sh --auto   # Auto-populate .env file
#   ./generate-keys.sh -a       # Auto-populate .env file

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

# Generate keys
N8N_KEY=$(openssl rand -hex 32)
STATAMIC_KEY=$(openssl rand -base64 32)
SECURE_PASS=$(openssl rand -base64 16 | tr -d '/+=' | head -c 20)
BILLING_DB_PASS=$(openssl rand -base64 16 | tr -d '/+=' | head -c 20)

# Check for --auto or -a flag
AUTO_MODE=false
if [[ "$1" == "--auto" || "$1" == "-a" ]]; then
    AUTO_MODE=true
fi

echo "=========================================="
echo "Common Cloud - Secure Key Generator"
echo "=========================================="
echo ""

if $AUTO_MODE; then
    # Create minimal .env if missing (no secrets in repo; see ENV-VARS.md)
    if [ ! -f "$ENV_FILE" ]; then
        touch "$ENV_FILE"
        echo "✓ Created empty .env (add other vars from ENV-VARS.md on the server)"
    fi

    # Update or append generated keys in .env (no secrets in repo; see ENV-VARS.md)
    set_var() {
        local key="$1" val="$2"
        if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
            else
                sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
            fi
        else
            echo "${key}=${val}" >> "$ENV_FILE"
        fi
    }
    set_var "N8N_ENCRYPTION_KEY" "$N8N_KEY"
    set_var "N8N_BASIC_AUTH_PASSWORD" "$SECURE_PASS"
    set_var "STATAMIC_APP_KEY" "base64:$STATAMIC_KEY"
    set_var "BILLING_DB_PASSWORD" "$BILLING_DB_PASS"

    echo "✓ .env file updated with generated keys"
    echo ""
    echo "Generated values:"
    echo "  N8N_ENCRYPTION_KEY=$N8N_KEY"
    echo "  N8N_BASIC_AUTH_PASSWORD=$SECURE_PASS"
    echo "  STATAMIC_APP_KEY=base64:$STATAMIC_KEY"
    echo "  BILLING_DB_PASSWORD=$BILLING_DB_PASS"
    echo ""
    echo "=========================================="
    echo "Next steps: Set other vars on server (see ENV-VARS.md); then docker compose up -d"
    echo "=========================================="
else
    # Print keys to console (original behavior)
    echo "N8N_ENCRYPTION_KEY=$N8N_KEY"
    echo ""
    echo "STATAMIC_APP_KEY=base64:$STATAMIC_KEY"
    echo ""
    echo "N8N_BASIC_AUTH_PASSWORD=$SECURE_PASS"
    echo ""
    echo "BILLING_DB_PASSWORD=$BILLING_DB_PASS"
    echo ""
    echo "=========================================="
    echo "Copy the values above to your .env file"
    echo ""
    echo "Or run with --auto to auto-populate .env:"
    echo "  ./generate-keys.sh --auto"
    echo "=========================================="
fi
