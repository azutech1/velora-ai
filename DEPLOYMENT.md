# Velora AI Deployment Checklist

Velora AI deploys to Vercel from the GitHub repository:

- Repository: `https://github.com/azutech1/velora-ai`
- Production branch: `main`
- Production URL: `https://www.veloraai.xyz`
- Deployment provider: Vercel Git integration

Every successful push to `main` starts a Vercel production deployment.

## Pre-Deployment Validation

Run these checks before committing completed work:

```bash
npm run lint
npm run build
git status
```

Only continue when lint and build pass.

## Commit And Push

Stage, commit, and push completed work:

```bash
git add .
git commit -m "Update Velora AI production"
git push origin main
```

## Vercel Deployment Verification

After pushing to `main`:

1. Open the Vercel project dashboard.
2. Confirm a new production deployment started from the latest GitHub commit.
3. Wait for the deployment status to become `Ready`.
4. Verify the live site:

```text
https://www.veloraai.xyz
```

## Live Smoke Checks

Verify the pages affected by the completed work:

- Dashboard: `https://www.veloraai.xyz/dashboard`
- Profile: `https://www.veloraai.xyz/profile`
- Settings: `https://www.veloraai.xyz/settings`
- Agent Payments: `https://www.veloraai.xyz/agent-payments`
- Activity: `https://www.veloraai.xyz/activity`
- Bridge & Swap: `https://www.veloraai.xyz/trade`

## Completion Criteria

A deployment is complete when:

- `npm run lint` passes.
- `npm run build` passes.
- `git status` shows only intentional changes before commit.
- Changes are committed to `main`.
- `git push origin main` succeeds.
- Vercel production deployment is `Ready`.
- The live production URL reflects the latest code.
