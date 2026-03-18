# Cloud Publica — Open Source Trackers

Automated data pipelines that monitor the real-world impact of policy decisions. These scripts power the live trackers at [cloudpublica.org/tracker/](https://cloudpublica.org/tracker/).

## Trackers

### USAID Tracker
Monitors the impact of USAID funding cuts on global health programs. Polls USAspending.gov and WHO APIs every 6 hours.

- **Script:** `usaid-tracker/poll.py`
- **Data:** `usaid-tracker/tracker-data.json`
- **Live:** [cloudpublica.org/tracker/usaid/](https://cloudpublica.org/tracker/usaid/)

### OSINT Sentinel
Automated open-source intelligence polling. Monitors federal contract awards (USAspending), ICE contract data (Micah Lee), Epstein case drops (SilenceDidThis), and entity searches (OCCRP Aleph).

- **Script:** `osint-sentinel/poll.py`

## How It Works

Each tracker runs on a cron schedule (typically every 6 hours), pulling from public APIs. Data is stored and served with zero external dependencies. All sources are cited, all methodology is documented, all data is verifiable.

## License

These scripts are provided for transparency and replication. If you build on this work, cite [Cloud Publica](https://cloudpublica.org) and [Gifted Dreamers, Inc.](https://gifteddreamers.org)
