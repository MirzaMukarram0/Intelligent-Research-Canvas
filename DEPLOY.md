# Deploy to Google Cloud Run

The repo ships with a multi-stage `Dockerfile` (Next.js standalone output), a
`cloudbuild.yaml` pipeline, and a `.dockerignore` / `.gcloudignore`. You only
need a Google Cloud project and a Gemini API key.

## 0. Prerequisites (one-time)

```powershell
# 1. Install gcloud CLI: https://cloud.google.com/sdk/docs/install
gcloud auth login
gcloud auth application-default login

# 2. Pick (or create) a project and lock it in for this shell.
$PROJECT_ID  = "your-gcp-project-id"
$REGION      = "us-central1"
$REPO        = "research-canvas"
$SERVICE     = "research-canvas"

gcloud config set project $PROJECT_ID

# 3. Enable the APIs we need.
gcloud services enable `
  run.googleapis.com `
  cloudbuild.googleapis.com `
  artifactregistry.googleapis.com `
  secretmanager.googleapis.com
```

## 1. Create the Artifact Registry repo (one-time)

```powershell
gcloud artifacts repositories create $REPO `
  --repository-format=docker `
  --location=$REGION `
  --description="Intelligent Research Canvas images"
```

## 2. Store the Gemini API key in Secret Manager (one-time)

Get a key from <https://aistudio.google.com/app/apikey>, then:

```powershell
"YOUR_REAL_GEMINI_KEY" | gcloud secrets create gemini-api-key --data-file=-

# Allow the Cloud Run runtime SA to read it.
$PROJECT_NUM = (gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding gemini-api-key `
  --member="serviceAccount:$PROJECT_NUM-compute@developer.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor"
```

To rotate later: `"NEW_KEY" | gcloud secrets versions add gemini-api-key --data-file=-`

## 3a. Deploy via Cloud Build (recommended)

This uses the `cloudbuild.yaml` in the repo root. It builds, pushes, and
deploys in one shot.

```powershell
gcloud builds submit `
  --config=cloudbuild.yaml `
  --substitutions="_REGION=$REGION,_REPO=$REPO,_SERVICE=$SERVICE,_GEMINI_SECRET_NAME=gemini-api-key:latest"
```

## 3b. Or deploy manually

```powershell
$IMAGE = "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/$SERVICE`:v1"

# Build & push
gcloud builds submit --tag $IMAGE

# Deploy
gcloud run deploy $SERVICE `
  --image=$IMAGE `
  --region=$REGION `
  --platform=managed `
  --allow-unauthenticated `
  --port=8080 `
  --memory=1Gi `
  --cpu=1 `
  --min-instances=0 `
  --max-instances=5 `
  --concurrency=40 `
  --timeout=120 `
  --set-secrets=GEMINI_API_KEY=gemini-api-key:latest
```

When the deploy finishes, gcloud prints the public URL, for example
`https://research-canvas-xxxxxx-uc.a.run.app`.

## 4. (Optional) Connect a custom domain

```powershell
gcloud beta run domain-mappings create `
  --service=$SERVICE `
  --domain=canvas.example.com `
  --region=$REGION
```

Then add the DNS record gcloud prints to your provider.

## 5. (Optional) Continuous deploys from GitHub

In the Cloud Console → Cloud Build → Triggers, add a trigger:

- **Event**: Push to branch `main`
- **Source**: your GitHub repo
- **Configuration**: Cloud Build configuration file → `cloudbuild.yaml`
- **Substitutions**: leave defaults (already set in the YAML)

Every push to `main` will rebuild and roll out a new revision.

## Troubleshooting

| Symptom                                              | Fix                                                                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `API key not valid` in `/api/export` or `/api/chat`  | Secret missing or runtime SA lacks `roles/secretmanager.secretAccessor`. Re-run step 2.                      |
| Cold start over 10s                                  | Set `--min-instances=1` (extra cost) or keep an uptime check warm.                                           |
| `npm ci` fails with `ERESOLVE`                       | The Dockerfile already passes `--legacy-peer-deps`. Make sure you didn't strip it.                           |
| 504 on `/api/analyze`                                | Long PDFs can exceed 60s. Increase `--timeout=300` and `maxDuration` in the route file (currently `60`).     |
| Build OOM in Cloud Build                             | Bump machine type — already set to `E2_HIGHCPU_8` in `cloudbuild.yaml`.                                      |
| `next/font` warnings about Google Fonts at build     | Build runs offline → Geist comes from `geist` package; Instrument Serif loads at runtime client-side. Safe.  |
