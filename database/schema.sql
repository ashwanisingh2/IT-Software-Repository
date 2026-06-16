CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('admin','engineer','viewer');
CREATE TYPE file_type AS ENUM ('exe','msi','zip','bat','ps1');
CREATE TYPE document_type AS ENUM ('kb','pdf','windows_server','network','sop');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE software (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, vendor)
);

CREATE TABLE software_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  software_id UUID NOT NULL REFERENCES software(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type file_type NOT NULL,
  file_size BIGINT NOT NULL,
  sha256 CHAR(64) NOT NULL,
  github_release_id TEXT,
  github_asset_id TEXT,
  download_url TEXT NOT NULL,
  silent_install_command TEXT,
  uninstall_command TEXT,
  download_count BIGINT NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES users(id),
  upload_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (software_id, version, sha256)
);

CREATE INDEX idx_software_search ON software USING gin (to_tsvector('english', name || ' ' || vendor || ' ' || category));
CREATE INDEX idx_software_versions_latest ON software_versions (software_id, upload_date DESC);
CREATE INDEX idx_software_versions_downloads ON software_versions (download_count DESC);

CREATE TABLE deployment_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE deployment_package_items (
  deployment_package_id UUID REFERENCES deployment_packages(id) ON DELETE CASCADE,
  software_version_id UUID REFERENCES software_versions(id) ON DELETE CASCADE,
  install_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (deployment_package_id, software_version_id)
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type document_type NOT NULL,
  category TEXT,
  body_md TEXT,
  file_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE computers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  computer_name TEXT UNIQUE NOT NULL,
  os_version TEXT NOT NULL,
  last_check_in TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE computer_software (
  computer_id UUID REFERENCES computers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  vendor TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (computer_id, name)
);

CREATE TABLE computer_updates (
  computer_id UUID REFERENCES computers(id) ON DELETE CASCADE,
  kb_id TEXT NOT NULL,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (computer_id, kb_id)
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER software_touch BEFORE UPDATE ON software FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER documents_touch BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
