# USAID Impact Tracker — Data Collection Methodology

## Overview

The USAID Impact Tracker monitors the real-world impact of USAID defunding on global health. It combines peer-reviewed mortality projections with live government spending data, WHO health indicators, and news coverage. Data is collected automatically every 6 hours and published to a public JSON endpoint.

## Data Sources

### 1. Mortality Projection (Counter)

**Source:** Cavalcanti D, et al. "Evaluating the impact of two decades of USAID interventions and projecting the effects of defunding on mortality up to 2030." *The Lancet*, Vol 406, Issue 10500, pp 283-294, July 2025.
- DOI: `10.1016/S0140-6736(25)01186-9`
- SSRN preprint: `https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5239038`

**Methodology:** The study analyzed data from 133 low- and middle-income countries covering 2001-2021, using statistical modeling that accounted for population, income, education, and health system factors. Two scenarios were projected through 2030: sustained 2023-level USAID funding vs the 83% funding cuts announced in early 2025.

**Key findings used in the tracker:**
- 91 million deaths prevented by USAID programs (2001-2021)
- 14+ million additional preventable deaths projected by 2030 under 83% cut scenario
- 4.5 million projected child deaths (under 5) by 2030
- ~700,000 additional child deaths per year

**Counter methodology:** Linear interpolation from 757,314 (January 1, 2026) to 14,000,000 (January 1, 2030). This is a projection, not a measurement. Actual impact may differ from the Lancet model's assumptions.

**Researchers:** Dr. Davide Rasella (Barcelona Institute for Global Health, coordinator), Dr. Daniella Cavalcanti (Federal University of Bahia, first author), Dr. James Macinko (UCLA Fielding School of Public Health), Dr. Francisco Saute (Manhica Health Research Centre, Mozambique), and collaborators from Spain, Brazil, and Mozambique.

### 2. Funding Data

**Source:** USAspending.gov API v2 (public, no authentication required)
- Base URL: `https://api.usaspending.gov/api/v2/`
- Agency: Agency for International Development (toptier code 072)

**Endpoints used:**
- `/search/spending_by_award/` — Top contract awards by fiscal year, sorted by amount. Filter: funding agency = "Agency for International Development", award type codes A/B/C/D (contracts).
- `/agency/072/program_activity/` — Program-level obligation data by fiscal year.
- `/agency/072/budgetary_resources/` — Agency-wide budgetary resources.
- `/agency/072/` — Agency overview and metadata.

**Program naming:** Award descriptions from USAspending are parsed to identify program areas:
- "GHSC" + "HIV/AIDS" → HIV/AIDS (PEPFAR Supply Chain)
- "MALARIA" → Malaria Prevention & Treatment
- "PRH" or "REPRODUCTIVE HEALTH" → Reproductive Health / Family Planning
- "RAPID TEST" or "RTKS" → HIV Rapid Test Kits
- "BHA" or "HUMANITARIAN" → Humanitarian Assistance
- "FEED THE FUTURE" or "FOOD" → Feed the Future / Food Security
- "INFECTIOUS DISEASE" or "STRIDES" → Infectious Disease Detection
- And others (see pipeline source code)

**Fiscal year note:** Federal fiscal years run October 1 through September 30. FY2024 = October 2023 through September 2024.

**Update frequency:** Every 6 hours. USAspending data has a 30-90 day reporting lag from FPDS/FABS.

### 3. Health Indicators

**Source:** WHO Global Health Observatory (GHO) OData API (public, no authentication required)
- Base URL: `https://ghoapi.azureedge.net/api/`
- Format: OData v4 (JSON)

**Indicators monitored:**

| Indicator | WHO Code | Type | Latest Data |
|---|---|---|---|
| Under-5 Mortality Rate (per 1000 live births) | `MDG_0000000001` | Rate | 2023 |
| Maternal Mortality Ratio (per 100k live births) | `MDG_0000000026` | Rate | 2023 |
| HIV/AIDS Deaths (number) | `HIV_0000000006` | Count | 2024 |
| Malaria Deaths (estimated number) | `MALARIA_EST_DEATHS` | Count | 2024 |
| TB Incidence (per 100k) | `MDG_0000000020` | Rate | 2024 |
| Malaria Incidence (per 1000 at risk) | `MALARIA_EST_INCIDENCE` | Rate | 2024 |

**Priority countries (20):** Afghanistan (AFG), Bangladesh (BGD), Democratic Republic of the Congo (COD), Ethiopia (ETH), Ghana (GHA), Haiti (HTI), India (IND), Kenya (KEN), Malawi (MWI), Mali (MLI), Mozambique (MOZ), Niger (NER), Nigeria (NGA), Pakistan (PAK), Somalia (SOM), South Sudan (SSD), Tanzania (TZA), Uganda (UGA), Zambia (ZMB), Zimbabwe (ZWE).

These are among the top USAID-recipient countries by program spending. Indicator values are averaged across reporting countries for each year.

**Data lag:** WHO mortality estimates are modeled and typically lag 1-2 years. HIV/malaria/TB data is most recent (2024). Under-5 and maternal mortality estimates are latest 2023.

**Update frequency:** Every 6 hours (polling). WHO data itself updates annually (typically Q1-Q2).

### 4. News Coverage

**Source:** GDELT Project API (public, no authentication required)
- Base URL: `https://api.gdeltproject.org/api/v2/doc/doc`
- Format: JSON

**Queries monitored:**
- "USAID defunding health"
- "PEPFAR funding cuts HIV"
- "malaria aid cuts Africa"
- "maternal mortality aid cuts"

**Parameters:** Article list mode, 10 most recent results per query, sorted by date descending, 30-day window.

**Rate limits:** GDELT rate-limits rapid requests (HTTP 429). The 6-hour polling interval avoids this. Some queries may return empty results on any given poll; this is normal.

## Data Pipeline

**Collection:** An automated Python script polls all four data sources every 6 hours (03:00, 09:00, 15:00, 21:00 UTC).

**Processing:** Raw API responses are parsed, filtered to priority countries (WHO), enriched with program names (USAspending), and assembled into a single JSON structure.

**Storage:** The assembled JSON is stored in Cloudflare R2 (S3-compatible object storage) and served via a Cloudflare Worker with CORS headers and 1-hour cache.

**Public endpoint:** `https://data.cloudpublica.org/usaid-tracker/tracker-data.json`

## Data Structure

The JSON output contains:

```
{
  "metadata": { "generated_at", "update_frequency" },
  "counter": { "projected_deaths_today", "projected_deaths_2030", ... },
  "lancet": { "total_prevented_2001_2021", "disease_reduction_lost", ... },
  "funding": {
    "data": {
      "FY2024": { "awards": [{ "program", "recipient", "amount", ... }] },
      "FY2025": { ... },
      "programs_FY2024": { "programs": [{ "name", "obligated", ... }] },
      "budgetary_resources": { ... }
    }
  },
  "health_indicators": {
    "indicators": {
      "under5_mortality_rate": { "by_year": { "2023": { "mean", "n_countries" } } },
      ...
    }
  },
  "news_coverage": { "data": { "usaid_defunding": { "articles": [...] } } },
  "sources": [{ "name", "url", "description" }]
}
```

## Updating the Tracker

### To add a new data source:
1. Add a new polling function to the pipeline script
2. Add the data to the assembled JSON structure
3. Add rendering code to the tracker page JavaScript
4. Update this methodology document

### To add new priority countries:
1. Add ISO 3166-1 alpha-3 codes to the `PRIORITY_COUNTRIES` list in the pipeline
2. Update the country list on the tracker page

### To add new WHO indicators:
1. Find the indicator code at https://ghoapi.azureedge.net/api/
2. Add to the `WHO_INDICATORS` dictionary in the pipeline with code, label, and type (rate/count)

### To update the Lancet projection:
1. Update the `LANCET_PROJECTIONS` dictionary in the pipeline
2. Update `COUNTER_START_VALUE` / `COUNTER_END_VALUE` / dates if the study publishes revised figures
3. Update the counter JavaScript in the tracker page to match

## Limitations

- **The counter is a projection, not a measurement.** It linearly interpolates the Lancet study's estimates. Actual deaths may be higher or lower depending on factors the model doesn't capture (alternative funding sources, policy changes, humanitarian response).
- **USAspending data lags 30-90 days** from actual contract execution.
- **WHO mortality estimates lag 1-2 years** and are modeled, not directly measured.
- **Program naming is heuristic.** Award descriptions are parsed by keyword matching; some may be miscategorized.
- **GDELT coverage is not comprehensive.** News monitoring captures English-language reporting and may miss local-language coverage of health impacts.
- **Correlation is not causation.** Changes in WHO health indicators after USAID cuts may reflect multiple factors, not solely defunding.

## Source Code

The data pipeline and tracker page are part of the CloudPublica repository. The pipeline runs on research infrastructure maintained by Gifted Dreamers (501c3).

## Contact

Questions about data sources, methodology, or corrections: bee@justnice.us

---

*Last updated: March 17, 2026*
