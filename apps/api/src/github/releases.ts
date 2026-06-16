import { Octokit } from '@octokit/rest';
import fs from 'node:fs';
import { env } from '../config/env.js';
const octokit = env.GITHUB_TOKEN ? new Octokit({ auth: env.GITHUB_TOKEN }) : null;
export async function uploadReleaseAsset(tag: string, name: string, filePath: string) {
  if (!octokit || !env.GITHUB_OWNER || !env.GITHUB_REPO) throw new Error('GitHub integration is not configured');
  const owner = env.GITHUB_OWNER; const repo = env.GITHUB_REPO;
  let release;
  try { release = (await octokit.repos.getReleaseByTag({ owner, repo, tag })).data; }
  catch { release = (await octokit.repos.createRelease({ owner, repo, tag_name: tag, name: tag, draft: false, prerelease: false })).data; }
  const asset = await octokit.repos.uploadReleaseAsset({ owner, repo, release_id: release.id, name, data: fs.readFileSync(filePath) as unknown as string });
  return { releaseId: String(release.id), assetId: String(asset.data.id), downloadUrl: asset.data.browser_download_url };
}
export async function listReleaseAssets() {
  if (!octokit || !env.GITHUB_OWNER || !env.GITHUB_REPO) return [];
  const releases = await octokit.paginate(octokit.repos.listReleases, { owner: env.GITHUB_OWNER, repo: env.GITHUB_REPO, per_page: 100 });
  return releases.flatMap(r => r.assets.map(a => ({ tag: r.tag_name, name: a.name, size: a.size, downloadUrl: a.browser_download_url, assetId: String(a.id), releaseId: String(r.id) })));
}
