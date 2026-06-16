export function inferSilentInstall(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.msi')) return 'msiexec.exe /i "$InstallerPath" /qn /norestart';
  if (lower.endsWith('.ps1')) return 'powershell.exe -ExecutionPolicy Bypass -File "$InstallerPath"';
  if (lower.endsWith('.bat')) return 'cmd.exe /c "$InstallerPath"';
  if (lower.endsWith('.zip')) return 'Expand-Archive -Path "$InstallerPath" -DestinationPath "$env:TEMP\\WinRepoPackage" -Force';
  return 'Start-Process -FilePath "$InstallerPath" -ArgumentList "/quiet /norestart" -Wait -PassThru';
}
export function installCommand(name: string) { return `Install-App ${JSON.stringify(name)}`; }
export function updateCommand(name: string) { return `Update-App ${JSON.stringify(name)}`; }
export function deploymentScript(apps: string[]) { return apps.map(a => `Install-App ${JSON.stringify(a)}`).join('\n'); }
