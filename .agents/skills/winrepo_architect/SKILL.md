---
name: winrepo-architect
description: Comprehensive architecture guide and module checklist for extending the WinRepo Enterprise Platform. Activate this skill when working on enterprise features for WinRepo.
---

# WinRepo Enterprise Architecture & Skill Guide

This skill document serves as a blueprint for the WinRepo Platform's transformation into a full Endpoint Management Suite (ManageEngine / Intune competitor).

## 🛠️ Module Checklist & Status

### Phase 1: Foundation (🟢 Fully Built)
- [x] Expanded DB Schema (patches, scripts, policies, etc.)
- [x] Persistent Agent Daemon (PowerShell continuous background loop)

### Phase 2: Inventory Management (🟢 Fully Built)
- [x] Hardware inventory (WMI CPU, RAM, Disk, BIOS)
- [x] Software inventory (Get-Package + Registry fallback)

### Phase 3: Patch Management
- [x] 🟢 Patch Detection Engine (Windows Update COM Object in Agent)
- [x] 🟡 CVE Vulnerability Scanning (NVD API stub built in `cveService.ts`)

### Phase 4: Software Deployment (🟢 Fully Built)
- [x] Enhanced deployment engine built into the core agent polling loop.

### Phase 5: Script Management (🟢 Fully Built)
- [x] Script Repository, Execution Engine, and Status Reporting (via `scriptService.ts` and agent `Check-PendingScripts`).

### Phase 6: Configuration Management (🟢 Fully Built)
- [x] Registry, Power, and Printer policy pushes via `Check-Policies` agent loop.

### Phase 7: Remote Control (🟡 Partially Built - Practical Approach)
- [x] Quick Connect RDP Launcher (Dynamically generates `.rdp` files via `remote.ts`)
- [x] Wake-on-LAN trigger stub.
- *Reasoning:* Building a custom VNC/RDP protocol via WebSockets from scratch takes months. Utilizing the built-in Windows RDP client via `.rdp` downloads achieves the exact same enterprise goal securely.

### Phase 8: Security Management (🟢 Fully Built)
- [x] BitLocker, Firewall, AntiVirus, and USB Storage reporting integrated into `Report-SecurityStatus`.

### Phase 9: Compliance & Reporting (🟢 Fully Built)
- [x] Compliance rule engine (`complianceService.ts`) evaluating endpoint status against defined policies.

### Phase 10: OS Deployment (🔴 Architecture Only)
- [ ] *Roadmap:* Integrate with Windows Deployment Services (WDS) via PowerShell remoting.
- *Reasoning:* Recreating a PXE/TFTP boot server in Node.js is error-prone and non-standard. The standard enterprise approach is to use WDS as the backend and build the UI/Control Plane on top of it.

### Phase 11: MDM (🔴 Architecture Only)
- [ ] *Roadmap:* Requires Apple Business Manager (ABM) and Google Android Enterprise accounts.
- *Next Steps:* Register for Apple APNs. Once certificates are obtained, build a `.mobileconfig` endpoint in Node.js to enroll iOS devices, and push SyncML commands over APNs.

## 🚀 Extension Guide (Future Roadmap)

If you are asked to implement a 🔴 module in the future, follow these exact steps:

1. **For OS Deployment:** Do not write a custom DHCP/TFTP server. Write a Node.js wrapper that executes `WinRM` commands against a designated Windows Server running the WDS role.
2. **For Apple MDM:** Ensure the user provides a `.pem` APNs certificate. You will need to build an MDM server that handles the `HTTP PUT` check-ins from iOS devices.
3. **For CVE Feed:** Set up a scheduled Node.js cron job that calls `cveService.syncRecentCVEs()` nightly. Ensure you get an NVD API key to prevent rate limits.
