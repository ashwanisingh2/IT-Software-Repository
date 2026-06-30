-- ENUMs
CREATE TYPE user_role AS ENUM ('super_admin','admin','deployer','viewer');
CREATE TYPE software_category AS ENUM ('browser','security','development','utility','office','communication','media','networking','system','other');
CREATE TYPE software_status AS ENUM ('active','deprecated','beta');
CREATE TYPE doc_category AS ENUM ('kb','sop','guide','network','server','other');

-- Tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE software (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category software_category NOT NULL,
  status software_status NOT NULL DEFAULT 'active',
  latest_version TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_url TEXT NOT NULL,
  download_count BIGINT NOT NULL DEFAULT 0,
  silent_install_args TEXT,
  architecture TEXT DEFAULT 'any',
  requires_software_id UUID REFERENCES software(id),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE software_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  software_id UUID NOT NULL REFERENCES software(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_url TEXT NOT NULL,
  release_notes TEXT NOT NULL DEFAULT '',
  is_latest BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(software_id, version)
);

CREATE TABLE enrollment_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL DEFAULT 'default',
  created_by UUID NOT NULL REFERENCES users(id),
  max_uses INTEGER,
  use_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_enrollment_tokens_token ON enrollment_tokens(token) WHERE revoked = FALSE;

CREATE TABLE endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id TEXT NOT NULL UNIQUE,
  hostname TEXT NOT NULL,
  ip_address INET,
  os_name TEXT NOT NULL,
  os_version TEXT NOT NULL,
  os_arch TEXT NOT NULL DEFAULT 'x64',
  enrollment_token_id UUID REFERENCES enrollment_tokens(id),
  agent_version TEXT,
  api_key_hash TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active | stale | decommissioned | manual
  last_checkin TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE deployment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
  software_id UUID NOT NULL REFERENCES software(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending | completed | failed
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE TABLE installed_software (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
  software_id UUID REFERENCES software(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  vendor TEXT NOT NULL DEFAULT '',
  installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(endpoint_id, name)
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category doc_category NOT NULL DEFAULT 'kb',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE role_permissions (
  role user_role NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  PRIMARY KEY (role, resource, action)
);

-- INDEXES
CREATE INDEX idx_software_category ON software(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_software_status ON software(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_software_created_by ON software(created_by);
CREATE INDEX idx_software_versions_software_id ON software_versions(software_id);
CREATE INDEX idx_software_versions_is_latest ON software_versions(software_id, is_latest);
CREATE INDEX idx_endpoints_machine_id ON endpoints(machine_id);
CREATE INDEX idx_endpoints_status ON endpoints(status);
CREATE INDEX idx_installed_software_endpoint_id ON installed_software(endpoint_id);
CREATE INDEX idx_installed_software_software_id ON installed_software(software_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_docs_category ON docs(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_docs_tags ON docs USING GIN(tags);
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_deployment_requests_endpoint_id ON deployment_requests(endpoint_id);

-- PLpgSQL TRIGGERS

-- 1. auto_update_timestamp
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER trg_users_update_ts BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_software_update_ts BEFORE UPDATE ON software FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_endpoints_update_ts BEFORE UPDATE ON endpoints FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_installed_software_update_ts BEFORE UPDATE ON installed_software FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_docs_update_ts BEFORE UPDATE ON docs FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- 2. fn_mark_latest_version
CREATE OR REPLACE FUNCTION fn_mark_latest_version()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE software_versions SET is_latest = FALSE
  WHERE software_id = NEW.software_id AND id != NEW.id;
  NEW.is_latest := TRUE;
  UPDATE software SET latest_version = NEW.version,
    sha256 = NEW.sha256, file_size = NEW.file_size,
    storage_url = NEW.storage_url, updated_at = NOW()
  WHERE id = NEW.software_id;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_mark_latest_version BEFORE INSERT ON software_versions FOR EACH ROW EXECUTE FUNCTION fn_mark_latest_version();

-- 3. fn_prevent_hard_delete
CREATE OR REPLACE FUNCTION fn_prevent_hard_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Hard delete not allowed. Use soft delete (set deleted_at).';
END; $$;

CREATE TRIGGER trg_users_prevent_delete BEFORE DELETE ON users FOR EACH ROW EXECUTE FUNCTION fn_prevent_hard_delete();
CREATE TRIGGER trg_software_prevent_delete BEFORE DELETE ON software FOR EACH ROW EXECUTE FUNCTION fn_prevent_hard_delete();
CREATE TRIGGER trg_docs_prevent_delete BEFORE DELETE ON docs FOR EACH ROW EXECUTE FUNCTION fn_prevent_hard_delete();

-- STORED FUNCTIONS

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'totalPackages', (SELECT COUNT(*) FROM software WHERE deleted_at IS NULL),
    'totalEndpoints', (SELECT COUNT(*) FROM endpoints WHERE status = 'active'),
    'staleEndpoints', (SELECT COUNT(*) FROM endpoints WHERE status = 'stale'),
    'totalDownloads', (SELECT COALESCE(SUM(download_count),0) FROM software WHERE deleted_at IS NULL),
    'updatesNeeded', (
      SELECT COUNT(DISTINCT e.id) FROM endpoints e
      JOIN installed_software ins ON e.id = ins.endpoint_id
      JOIN software s ON ins.software_id = s.id AND s.deleted_at IS NULL
      WHERE ins.version != s.latest_version AND e.status != 'decommissioned'
    ),
    'totalDocs', (SELECT COUNT(*) FROM docs WHERE deleted_at IS NULL),
    'activeUsers', (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL)
  ) INTO result;
  RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION get_endpoint_update_summary(p_machine_id TEXT)
RETURNS TABLE(software_name TEXT, installed_version TEXT, latest_version TEXT)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT s.name, ins.version, s.latest_version
  FROM endpoints e
  JOIN installed_software ins ON e.id = ins.endpoint_id
  JOIN software s ON ins.software_id = s.id AND s.deleted_at IS NULL
  WHERE e.machine_id = p_machine_id AND ins.version != s.latest_version;
END; $$;

-- SEED DATA
INSERT INTO role_permissions (role, resource, action) VALUES
('super_admin','software','read'),('super_admin','software','write'),
('super_admin','software','delete'),('super_admin','software','deploy'),
('super_admin','inventory','read'),('super_admin','inventory','write'),
('super_admin','docs','read'),('super_admin','docs','write'),
('super_admin','docs','delete'),('super_admin','users','read'),
('super_admin','users','write'),('super_admin','audit','read'),
('admin','software','read'),('admin','software','write'),
('admin','software','delete'),('admin','inventory','read'),
('admin','docs','read'),('admin','docs','write'),
('deployer','software','read'),('deployer','software','deploy'),
('deployer','inventory','read'),('deployer','inventory','write'),
('deployer','docs','read'),
('viewer','software','read'),('viewer','inventory','read'),('viewer','docs','read')
ON CONFLICT (role, resource, action) DO NOTHING;
