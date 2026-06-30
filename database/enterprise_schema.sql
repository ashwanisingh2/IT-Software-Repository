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
