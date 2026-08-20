# Copilot cloud agent

This repo is set up so **GitHub Copilot** can take issues on its own and open PRs.

> Native **Automations** UI (Agents → Automations) only works on **private/internal** repos. This repo is **public**, so auto-trigger uses **GitHub Actions** + the Issues assign API instead.

## Files

| Path | Purpose |
|------|---------|
| `.github/copilot-instructions.md` | Repo-wide rules |
| `.github/instructions/*.instructions.md` | Path-specific rules (data / Phaser) |
| `.github/agents/hearthvale-builder.agent.md` | Custom agent for one Path A slice |
| `.github/workflows/copilot-setup-steps.yml` | Pre-install deps + verify + build |
| `.github/workflows/auto-assign-copilot.yml` | **Auto-trigger** when an issue has label `copilot` |
| `.github/workflows/scheduled-copilot-slice.yml` | **Weekly** (Mon 18:00 UTC) opens next Phase C issue + assigns Copilot |
| `.github/ISSUE_TEMPLATE/copilot-task.yml` | Issue form (adds `copilot` label) |
| `AGENTS.md` | Root pointer → `HearthVale/AGENTS.md` |

## One-time secrets (required for auto-trigger)

`GITHUB_TOKEN` cannot start Copilot sessions. Add a **user** PAT:

1. Create a [fine-grained PAT](https://github.com/settings/tokens?type=beta) for `brennin0820/HearthVale` with:
   - **Issues** Read and write  
   - **Contents** Read and write  
   - **Pull requests** Read and write  
   - **Actions** Read and write  
   - **Metadata** Read  
2. Repo **Settings → Secrets and variables → Actions → New repository secret**  
   Name: `COPILOT_AGENT_TOKEN`  
   Value: the PAT  

Without this secret, auto-assign / scheduled workflows fail with a clear error.

## Enable

1. Merge `.github/**` onto **`main`**.
2. Copilot account: https://github.com/settings/copilot  
3. Repo **Settings → Copilot** — enable coding agent if shown for your plan.

## How auto-trigger fires

| Trigger | What happens |
|---------|----------------|
| New issue with label `copilot` (use **Copilot task** template) | Workflow assigns `copilot-swe-agent[bot]` + `hearthvale-builder` |
| Label `copilot` added to an open issue | Same |
| Monday 18:00 UTC (or **Actions → Scheduled Copilot Phase C slice → Run workflow**) | Creates `[Copilot] …` issue for the next open Phase C slice and assigns Copilot |
| Manual: **Actions → Auto-assign Copilot → Run workflow** + issue number | Assigns that issue |

## Manual start (no Actions)

- https://github.com/copilot/agents → `brennin0820/HearthVale` → **hearthvale-builder**
- Or assign **Copilot** on an issue in the UI

## Windows + Mac

Same GitHub remote. Cloud agent always runs on **Ubuntu** Actions runners, not your Windows PC.
