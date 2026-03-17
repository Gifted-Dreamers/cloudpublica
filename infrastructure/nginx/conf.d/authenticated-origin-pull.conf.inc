# Cloudflare Authenticated Origin Pulls
# Only accept connections from Cloudflare's edge (prevents direct-to-origin attacks)
# Include this in each CF-proxied server block (not grey-cloud sites)
# Cert: https://developers.cloudflare.com/ssl/static/authenticated_origin_pull_ca.pem
ssl_client_certificate /etc/nginx/certs/cloudflare-origin-pull-ca.pem;
ssl_verify_client on;
