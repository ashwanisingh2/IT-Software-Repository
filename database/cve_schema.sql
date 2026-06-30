CREATE TABLE IF NOT EXISTS cve_vulnerabilities (
  cve_id TEXT PRIMARY KEY,
  description TEXT,
  base_score DECIMAL(3,1),
  severity TEXT,
  published_date TIMESTAMPTZ,
  last_modified_date TIMESTAMPTZ,
  affected_software JSONB, -- Array of CPEs
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS software_cves (
  software_id UUID REFERENCES software(id) ON DELETE CASCADE,
  cve_id TEXT REFERENCES cve_vulnerabilities(cve_id) ON DELETE CASCADE,
  status TEXT DEFAULT 'unmitigated', -- unmitigated | mitigated
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (software_id, cve_id)
);
