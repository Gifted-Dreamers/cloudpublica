#!/bin/bash
# Setup SSHFS mount for LinkStack database access
# Run this on Docker server (cloudpublica.org)
#
# This script sets up SSHFS to mount LinkStack database from YunoHost server
# Automatically fetches SSH key from 1Password

set -e

YUNOHOST_HOST="commoncloud.cc"
YUNOHOST_USER="ccadmin"
YUNOHOST_DB_PATH="/var/www/linkstack/database/database.sqlite"
LOCAL_MOUNT_POINT="/mnt/linkstack-db"
SSH_KEY_ITEM="gcik5bvxsdd464ggpkhm3wdbpm"
SSH_KEY_PATH="$HOME/.ssh/yunohost-linkstack.pem"

echo "🔧 Setting up SSHFS mount for LinkStack database..."
echo "   Source: ${YUNOHOST_USER}@${YUNOHOST_HOST}:${YUNOHOST_DB_PATH}"
echo "   Mount: ${LOCAL_MOUNT_POINT}"
echo ""

# Check if SSHFS is installed
if ! command -v sshfs &> /dev/null; then
    echo "📦 Installing SSHFS..."
    sudo apt-get update
    sudo apt-get install -y sshfs
fi

# Create mount point
echo "📁 Creating mount point..."
sudo mkdir -p "$LOCAL_MOUNT_POINT"
sudo chown $USER:$USER "$LOCAL_MOUNT_POINT"

# Get SSH key from 1Password
echo "🔐 Getting SSH key from 1Password..."
mkdir -p "$HOME/.ssh"

if command -v op &> /dev/null; then
    # Fetch SSH key from 1Password
    op item get "$SSH_KEY_ITEM" --format json --account gifteddreamers 2>/dev/null | \
        jq -r '.fields[] | select(.label == "private key") | .value' > "$SSH_KEY_PATH"
    
    if [ ! -s "$SSH_KEY_PATH" ]; then
        echo "❌ Failed to retrieve SSH key from 1Password"
        echo "   Item ID: $SSH_KEY_ITEM"
        echo "   Field: private key"
        exit 1
    fi
    
    chmod 600 "$SSH_KEY_PATH"
    echo "✅ SSH key saved to $SSH_KEY_PATH"
else
    echo "⚠️  1Password CLI not found"
    echo "   Please ensure SSH key exists at: $SSH_KEY_PATH"
    echo "   Or install 1Password CLI: https://developer.1password.com/docs/cli"
    
    if [ ! -f "$SSH_KEY_PATH" ]; then
        exit 1
    fi
    
    chmod 600 "$SSH_KEY_PATH"
fi

# Test SSH connection
echo "🧪 Testing SSH connection..."
if ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o ConnectTimeout=5 \
    "${YUNOHOST_USER}@${YUNOHOST_HOST}" "test -f ${YUNOHOST_DB_PATH}" 2>/dev/null; then
    echo "✅ Database file exists and is accessible"
else
    echo "⚠️  Could not verify database file access"
    echo "   This may be normal - mount will be tested after setup"
fi

# Create systemd mount unit
echo "⚙️  Creating systemd mount unit..."
sudo tee /etc/systemd/system/mnt-linkstack-db.mount > /dev/null << EOF
[Unit]
Description=LinkStack Database SSHFS Mount
After=network-online.target
Wants=network-online.target

[Mount]
What=${YUNOHOST_USER}@${YUNOHOST_HOST}:$(dirname ${YUNOHOST_DB_PATH})
Where=${LOCAL_MOUNT_POINT}
Type=fuse.sshfs
Options=IdentityFile=${SSH_KEY_PATH},allow_other,default_permissions,uid=$(id -u),gid=$(id -g),reconnect,ServerAliveInterval=15,ServerAliveCountMax=3,_netdev

[Install]
WantedBy=multi-user.target
EOF

# Create systemd automount unit (auto-mounts on access)
echo "⚙️  Creating systemd automount unit..."
sudo tee /etc/systemd/system/mnt-linkstack-db.automount > /dev/null << EOF
[Unit]
Description=LinkStack Database SSHFS Automount
After=network-online.target
Wants=network-online.target

[Automount]
Where=${LOCAL_MOUNT_POINT}
TimeoutIdleSec=300

[Install]
WantedBy=multi-user.target
EOF

# Enable and start automount
echo "🔄 Enabling automount..."
sudo systemctl daemon-reload
sudo systemctl enable mnt-linkstack-db.automount
sudo systemctl start mnt-linkstack-db.automount

# Wait a moment for mount
sleep 2

# Verify mount
if mountpoint -q "$LOCAL_MOUNT_POINT"; then
    echo "✅ Mount successful!"
    echo "   Database file should be at: ${LOCAL_MOUNT_POINT}/database.sqlite"
    ls -lh "${LOCAL_MOUNT_POINT}/" || echo "   (Directory listing may require permissions)"
else
    echo "⚠️  Mount not active yet (will mount on first access)"
    echo "   Test with: ls ${LOCAL_MOUNT_POINT}/"
fi

echo ""
echo "✅ SSHFS setup complete!"
echo ""
echo "📝 Update docker-compose.yml to use:"
echo "   volumes:"
echo "     - ${LOCAL_MOUNT_POINT}/database.sqlite:/data/linkstack/database.sqlite:ro"
