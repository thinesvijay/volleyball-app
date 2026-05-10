# Apps Script Deploy With clasp

This project can deploy `Code.gs` to the existing Google Apps Script web app without changing the API URL.

The normal deploy command is:

```powershell
npm.cmd run apps-script:deploy
```

That command:

- runs `clasp push`
- creates an immutable Apps Script version
- redeploys the existing Web App deployment ID to that new version
- keeps the existing web app URL/API URL unchanged

## First-Time Setup

1. Install clasp globally:

```powershell
npm.cmd install -g @google/clasp
```

2. Enable the Google Apps Script API:

```text
https://script.google.com/home/usersettings
```

Turn on `Google Apps Script API`.

3. Log in:

```powershell
npm.cmd run apps-script:login
```

4. Create local `.clasp.json` from the template:

```powershell
Copy-Item .clasp.json.example .clasp.json
notepad .clasp.json
```

Set `scriptId` to the existing Apps Script project ID. You can find it in Apps Script under:

```text
Project Settings -> Script ID
```

Do not commit `.clasp.json`.

5. Find the existing Web App deployment ID:

```powershell
clasp deployments
```

Use the deployment ID for the current Web App deployment. Do not create a new deployment unless you intentionally want a new URL.

6. Save the deployment ID locally.

Option A, current terminal only:

```powershell
$env:APPS_SCRIPT_DEPLOYMENT_ID="PASTE_EXISTING_WEB_APP_DEPLOYMENT_ID"
```

Option B, local gitignored file:

```powershell
notepad .apps-script-deploy.env
```

Add:

```text
APPS_SCRIPT_DEPLOYMENT_ID=PASTE_EXISTING_WEB_APP_DEPLOYMENT_ID
```

Optional:

```text
APPS_SCRIPT_DEPLOY_MESSAGE=Make Teams Pro backend deploy
```

Do not commit `.apps-script-deploy.env`.

## Normal Deploy

After setup:

```powershell
npm.cmd run apps-script:deploy
```

## Useful Commands

Open the Apps Script project:

```powershell
npm.cmd run apps-script:open
```

Push files without deploying a web app version:

```powershell
npm.cmd run apps-script:push
```

## Safety Notes

- `.claspignore` is committed so only `Code.gs` and optional `appsscript.json` are pushed.
- `.clasp.json` is gitignored because it contains the project-specific Script ID.
- `.clasprc.json` is gitignored in case clasp writes auth locally.
- `.apps-script-deploy.env` is gitignored because it contains your existing deployment ID.
- The deploy script calls `clasp redeploy`, not `clasp deploy`, so it targets the existing Web App deployment and keeps the URL stable.

## After Deploy

Run:

```powershell
npm.cmd run supabase:post-cutover-check
npm.cmd run test:e2e
```
