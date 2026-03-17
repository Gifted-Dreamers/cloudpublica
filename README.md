# CloudPublica

**Independent investigations and open-source intelligence for the public interest.**

<p align="center">
  <a href="https://cloudpublica.org"><strong>cloudpublica.org</strong></a>
</p>

## What is CloudPublica?

CloudPublica publishes investigations, research, and tools focused on data privacy, surveillance, institutional accountability, and democratic infrastructure. All content is free, privacy-respecting, and built on open-source tooling.

## Site

Static HTML site deployed to Cloudflare Pages. Built with Tailwind CSS, no client-side frameworks.

- **Investigations**: Long-form research articles with Mermaid diagrams and citations
- **The Word**: Living vocabulary API -- 158 named concepts for structural knowledge sharing
- **OSINT tools**: Automated monitoring pipelines for public accountability data
- **USAID Tracker**: Automated polling of USAspending data, stored to Cloudflare R2

## Infrastructure

The `infrastructure/` directory contains the full Docker Compose stack powering `*.cloudpublica.org` subdomains:

| Service | Subdomain | Purpose |
|---------|-----------|---------|
| n8n | n8n.cloudpublica.org | Workflow automation |
| The Word API | word.cloudpublica.org | Living vocabulary REST API |
| Miniflux | feeds.cloudpublica.org | RSS reader (376 feeds) |
| Nextcloud | cloud.cloudpublica.org | File storage |
| Matrix Synapse | matrix.cloudpublica.org | Federated messaging |
| Element | element.cloudpublica.org | Matrix web client |
| Jitsi Meet | meet.cloudpublica.org | Video conferencing |
| AppFlowy | appflowy.cloudpublica.org | Project management |
| Appsmith | hq.cloudpublica.org | Internal dashboards |
| CryptPad | pad.cloudpublica.org | Encrypted documents |
| Collabora | office.cloudpublica.org | Document editing |
| Anytype | anytype.cloudpublica.org | Knowledge management |
| Snikket | snikket.cloudpublica.org | XMPP messaging |
| Syncthing | sync.cloudpublica.org | File synchronization |
| FacilMap | maps.cloudpublica.org | Collaborative mapping |
| LinkStack | links.cloudpublica.org | Link management |
| VVVeb | vvveb.cloudpublica.org | Web builder |
| Planet Earth Society | commondata.cc | Community partner site |
| Tor Relay | -- | Network relay + hidden service |
| WireGuard | -- | VPN |

```
infrastructure/
├── docker-compose.yml          # Full stack (40+ containers)
├── nginx/                      # Reverse proxy configs per service
│   ├── nginx.conf
│   └── conf.d/                 # Per-service vhosts
├── the-word/                   # Living vocabulary API (Express + SQLite)
│   ├── Dockerfile
│   ├── src/                    # TypeScript source
│   └── data/export.json        # Vocabulary dataset
├── monitoring/                 # Health checks + Datadog dashboards
│   ├── check-health.sh
│   ├── datadog/
│   └── scripts/
├── osint-sentinel/             # OSINT polling agent (Python)
│   └── poll.py
├── usaid-tracker/              # USAspending data tracker (Python)
│   └── poll.py
├── statamic/                   # CMS Dockerfile
├── element-config.json         # Element web client config
├── torrc                       # Tor relay config
└── generate-keys.sh            # Key generation helper
```

All secrets are managed via environment variables and 1Password -- no credentials in this repository.

## Development

```bash
# Build site CSS
npm install
npx tailwindcss -i assets/css/input.css -o assets/css/style.css

# Build static pages (partials injection)
node build.js

# Deploy (via GitHub Actions on push to main)
git push origin main
```

## Related Repos

- **[commoncloud.cc](https://github.com/Gifted-Dreamers/commoncloud.cc)** -- YunoHost apps serving commoncloud.cc
- **[justnice.us](https://github.com/Gifted-Dreamers/justnice.us)** -- Research publication site

## About

A project of [Gifted Dreamers](https://gifteddreamers.org), a 501(c)(3) nonprofit.

## License

[MIT](LICENSE)
