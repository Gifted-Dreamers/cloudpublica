// JSON-LD context and wrapper functions for The Word API responses

const CONTEXT = {
  "@vocab": "https://word.cloudpublica.org/vocab/",
  "schema": "https://schema.org/",
  "skos": "http://www.w3.org/2004/02/skos/core#",
  "name": "schema:name",
  "description": "schema:description",
  "author": "schema:author",
  "dateCreated": "schema:dateCreated",
  "url": "schema:url"
};

type Row = Record<string, unknown>;

export function wrapCollection(collectionType: string, items: Row[]): Row {
  return {
    "@context": CONTEXT,
    "@type": "vocab:Collection",
    "vocab:collectionType": collectionType,
    "schema:numberOfItems": items.length,
    "schema:itemListElement": items
  };
}

export function wrapName(row: Row): Row {
  return {
    "@context": CONTEXT,
    "@type": "vocab:Name",
    "@id": `https://word.cloudpublica.org/api/names/${row.id}`,
    name: row.name,
    feltSense: row.felt_sense,
    definition: row.definition,
    whyItMatters: row.why_it_matters,
    domain: row.domain,
    author: row.source_author,
    dateCreated: row.source_year,
    humanSearchTerms: row.human_search_terms,
    agentSearchTerms: row.agent_search_terms
  };
}

export function wrapSource(row: Row): Row {
  return {
    "@context": CONTEXT,
    "@type": "vocab:Source",
    "@id": `https://word.cloudpublica.org/api/sources/${row.id}`,
    name: row.name,
    author: row.author,
    dateCreated: row.year,
    description: row.description,
    url: row.url,
    sourceType: row.source_type
  };
}

export function wrapRediscovery(row: Row): Row {
  return {
    "@context": CONTEXT,
    "@type": "vocab:Rediscovery",
    "@id": `https://word.cloudpublica.org/api/rediscoveries/${row.id}`,
    name: row.name,
    observedBy: row.observed_by,
    platform: row.platform,
    description: row.description,
    mapsTo: row.maps_to_id
      ? `https://word.cloudpublica.org/api/names/${row.maps_to_id}`
      : null,
    dateObserved: row.date_observed,
    evidenceUrl: row.evidence_url,
    notes: row.notes
  };
}

export function wrapBridge(row: Row): Row {
  return {
    "@context": CONTEXT,
    "@type": "vocab:Bridge",
    "@id": `https://word.cloudpublica.org/api/bridges/${row.id}`,
    name: row.name,
    fromName: row.from_name,
    toName: row.to_name,
    relationship: row.relationship,
    description: row.description
  };
}
