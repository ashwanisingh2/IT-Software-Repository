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
