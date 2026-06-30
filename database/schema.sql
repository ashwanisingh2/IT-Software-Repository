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
-- ==========================================
-- PHASE 1: ENTERPRISE ENDPOINT MANAGEMENT SCHEMA
-- ==========================================

-- PATCH MANAGEMENT
CREATE TABLE IF NOT EXISTS patches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kb_article TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'Moderate',
  release_date TIMESTAMPTZ,
  download_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS endpoint_patches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
  patch_id UUID NOT NULL REFERENCES patches(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'missing', -- missing | installed | failed
  installed_at TIMESTAMPTZ,
  UNIQUE(endpoint_id, patch_id)
);

CREATE TABLE IF NOT EXISTS patch_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patch_id UUID NOT NULL REFERENCES patches(id) ON DELETE CASCADE,
  endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  deployed_by UUID REFERENCES users(id),
  deployed_at TIMESTAMPTZ,
  error_message TEXT
);

-- SCRIPT MANAGEMENT
CREATE TABLE IF NOT EXISTS scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  script_type TEXT NOT NULL DEFAULT 'powershell', -- powershell | batch | vbs
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS script_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
  executed_by UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending | running | success | failed
  exit_code INT,
  stdout TEXT,
  stderr TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- CONFIGURATION & COMPLIANCE POLICIES
CREATE TABLE IF NOT EXISTS configuration_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  policy_type TEXT NOT NULL, -- registry | file | power | printer
  payload JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- bitlocker | av | os_version | patch_age
  rule_condition JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- REMOTE SESSIONS (Quick Connect RDP / WinRM)
CREATE TABLE IF NOT EXISTS remote_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
  initiated_by UUID NOT NULL REFERENCES users(id),
  session_type TEXT NOT NULL, -- rdp | winrm
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- LICENSES & ASSET TRACKING
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  software_name TEXT NOT NULL,
  total_seats INT NOT NULL,
  purchased_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ALERTS & AUTOMATION
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID REFERENCES endpoints(id) ON DELETE CASCADE,
  severity TEXT NOT NULL DEFAULT 'warning', -- info | warning | critical
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL, -- new_endpoint | patch_failed | offline
  action_type TEXT NOT NULL, -- deploy_software | run_script | send_email
  action_payload JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- REPORTS CACHE
CREATE TABLE IF NOT EXISTS reports_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_name TEXT NOT NULL,
  data JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE endpoints 
ADD COLUMN IF NOT EXISTS cpu_model TEXT,
ADD COLUMN IF NOT EXISTS total_ram_bytes BIGINT,
ADD COLUMN IF NOT EXISTS total_disk_bytes BIGINT,
ADD COLUMN IF NOT EXISTS free_disk_bytes BIGINT,
ADD COLUMN IF NOT EXISTS bios_version TEXT,
ADD COLUMN IF NOT EXISTS manufacturer TEXT,
ADD COLUMN IF NOT EXISTS model TEXT;
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
ALTER TABLE endpoints
ADD COLUMN IF NOT EXISTS bitlocker_status TEXT,
ADD COLUMN IF NOT EXISTS firewall_enabled BOOLEAN,
ADD COLUMN IF NOT EXISTS av_status TEXT,
ADD COLUMN IF NOT EXISTS usb_storage_enabled BOOLEAN;
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS mfa_secret TEXT,
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE;
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSONB LANGUAGE plpgsql AS $body
DECLARE result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'totalPackages', (SELECT COUNT(*) FROM software WHERE deleted_at IS NULL),
    'totalEndpoints', (SELECT COUNT(*) FROM endpoints WHERE status = 'active'),
    'staleEndpoints', (SELECT COUNT(*) FROM endpoints WHERE status = 'stale'),
    'offlineEndpoints', (SELECT COUNT(*) FROM endpoints WHERE status = 'offline'),
    'vulnerableMachines', (SELECT COUNT(DISTINCT endpoint_id) FROM endpoint_patches WHERE status = 'missing'),
    'compliantMachines', (
        SELECT COUNT(*) FROM endpoints e 
        WHERE e.status = 'active' AND e.bitlocker_status = 'FullyEncrypted' AND e.firewall_enabled = true
    ),
    'recentDeployments', (SELECT COUNT(*) FROM patch_deployments WHERE deployed_at > NOW() - INTERVAL '7 days'),
    'activeUsers', (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL)
  ) INTO result;
  RETURN result;
END; $body;
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'totalPackages', (SELECT COUNT(*) FROM software WHERE deleted_at IS NULL),
    'totalEndpoints', (SELECT COUNT(*) FROM endpoints WHERE status = 'active'),
    'staleEndpoints', (SELECT COUNT(*) FROM endpoints WHERE status = 'stale'),
    'offlineEndpoints', (SELECT COUNT(*) FROM endpoints WHERE status = 'offline'),
    'vulnerableMachines', (SELECT COUNT(DISTINCT endpoint_id) FROM endpoint_patches WHERE status = 'missing'),
    'compliantMachines', (
        SELECT COUNT(*) FROM endpoints e 
        WHERE e.status = 'active' AND e.bitlocker_status = 'FullyEncrypted' AND e.firewall_enabled = true
    ),
    'recentDeployments', (SELECT COUNT(*) FROM patch_deployments WHERE deployed_at > NOW() - INTERVAL '7 days'),
    'activeUsers', (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL)
  ) INTO result;
  RETURN result;
END; $$;
