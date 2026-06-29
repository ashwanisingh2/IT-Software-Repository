-- database/schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum Types
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'deployer', 'viewer');

-- Trigger function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger function to maintain download count in software table
CREATE OR REPLACE FUNCTION increment_software_download_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Increment the download count of the parent software
    UPDATE software
    SET download_count = download_count + 1
    WHERE id = NEW.software_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger function to detect latest version
CREATE OR REPLACE FUNCTION update_latest_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the latest_version column of the software table with the newly inserted version
    UPDATE software
    SET latest_version = NEW.version,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.software_id;
    RETURN NEW;
END;
$$ language 'plpgsql';


-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'viewer' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Role Permissions Table
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role user_role NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (role, resource, action)
);

CREATE TRIGGER update_role_permissions_updated_at
BEFORE UPDATE ON role_permissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Software Table
CREATE TABLE software (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    vendor VARCHAR(255),
    category VARCHAR(100),
    version VARCHAR(100) NOT NULL,
    latest_version VARCHAR(100) NOT NULL,
    sha256 VARCHAR(64) NOT NULL,
    file_size BIGINT NOT NULL,
    download_count BIGINT DEFAULT 0 NOT NULL,
    storage_url TEXT NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_software_created_by ON software(created_by);
CREATE INDEX idx_software_category ON software(category);
CREATE INDEX idx_software_vendor ON software(vendor);

CREATE TRIGGER update_software_updated_at
BEFORE UPDATE ON software
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Software Versions Table
CREATE TABLE software_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    software_id UUID REFERENCES software(id) ON DELETE CASCADE NOT NULL,
    version VARCHAR(100) NOT NULL,
    sha256 VARCHAR(64) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_url TEXT NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_software_versions_software_id ON software_versions(software_id);
CREATE INDEX idx_software_versions_created_by ON software_versions(created_by);

CREATE TRIGGER update_software_versions_updated_at
BEFORE UPDATE ON software_versions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for latest version update
CREATE TRIGGER update_software_latest_version_trigger
AFTER INSERT ON software_versions
FOR EACH ROW EXECUTE FUNCTION update_latest_version();


-- Endpoints Table
CREATE TABLE endpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id VARCHAR(255) UNIQUE NOT NULL,
    hostname VARCHAR(255) NOT NULL,
    os_version VARCHAR(255),
    installed_software JSONB DEFAULT '[]'::jsonb,
    last_checkin TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_endpoints_machine_id ON endpoints(machine_id);

CREATE TRIGGER update_endpoints_updated_at
BEFORE UPDATE ON endpoints
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Installed Software Table (relational tracking)
CREATE TABLE installed_software (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint_id UUID REFERENCES endpoints(id) ON DELETE CASCADE NOT NULL,
    software_name VARCHAR(255) NOT NULL,
    installed_version VARCHAR(100),
    install_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (endpoint_id, software_name)
);

CREATE INDEX idx_installed_software_endpoint_id ON installed_software(endpoint_id);

CREATE TRIGGER update_installed_software_updated_at
BEFORE UPDATE ON installed_software
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource_type_id ON audit_logs(resource_type, resource_id);

CREATE TRIGGER update_audit_logs_updated_at
BEFORE UPDATE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Docs Table
CREATE TABLE docs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_docs_created_by ON docs(created_by);
CREATE INDEX idx_docs_category ON docs(category);

CREATE TRIGGER update_docs_updated_at
BEFORE UPDATE ON docs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Software Downloads Tracking
CREATE TABLE software_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    software_id UUID REFERENCES software(id) ON DELETE CASCADE NOT NULL,
    endpoint_id UUID REFERENCES endpoints(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_software_downloads_software_id ON software_downloads(software_id);

CREATE TRIGGER update_software_downloads_updated_at
BEFORE UPDATE ON software_downloads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to increment download count
CREATE TRIGGER increment_download_count_trigger
AFTER INSERT ON software_downloads
FOR EACH ROW EXECUTE FUNCTION increment_software_download_count();
