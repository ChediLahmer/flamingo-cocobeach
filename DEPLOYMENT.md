# Deployment Guide — Flamingo Coco Beach

Production deployment of the full stack (React public site + Vue admin + Fastify/Prisma/PostgreSQL/MinIO backend) to a single VPS, behind Traefik with HTTPS, and optionally fronted by Cloudflare.

This guide is specific to this repository. For the deeper "why" behind these choices, see the sibling `DEPLOYMENT_LESSONS.md`.

---

## 1. Architecture

One Docker Compose project (`docker-compose.prod.yml`) with seven services:

| Service      | Container          | Role                                                                    |
| ------------ | ------------------ | ----------------------------------------------------------------------- |
| `traefik`    | `flamingo-traefik` | Reverse proxy + automatic Let's Encrypt HTTPS                           |
| `db`         | `flamingo-db`      | PostgreSQL 16 (volume `pgdata`)                                         |
| `minio`      | `flamingo-storage` | S3-compatible object storage (volume `miniodata`)                       |
| `minio-init` | (one-shot)         | Creates the bucket + sets public-read (`download`) policy               |
| `backend`    | `flamingo-backend` | Fastify API on `api.<domain>`; runs `prisma migrate deploy` then starts |
| `client`     | `flamingo-client`  | nginx serving the React public site (`<domain>` / `www.<domain>`)       |
| `admin`      | `flamingo-admin`   | nginx serving the Vue admin panel (`admin.<domain>`)                    |

**Subdomains** (same layout as ilot). Each app is its own container behind Traefik:

- `https://<domain>/` and `https://www.<domain>/` → React public site
- `https://admin.<domain>/` → Vue admin panel
- `https://api.<domain>/` → Fastify backend (the frontends call it via `VITE_API_URL`, baked at build time)

**Two extra storage hostnames** (both A records → the same VPS IP):

- `storage.<domain>` → MinIO, **public read** — every `<img>`/`<video>` is served directly from here (never through the app server). Orange-cloud this in Cloudflare for edge caching.
- `upload.<domain>` → the **same** MinIO, used only for presigned video PUTs. Must be **grey-cloud (DNS-only)** so large uploads bypass Cloudflare's 100 MB body cap and use a browser-trusted Let's Encrypt cert.

**Networks:** `flamingo_web` (Traefik-facing) and `flamingo_internal` (db/minio/backend). Services exposed on both carry a `traefik.docker.network=flamingo_web` label — without it Traefik may route to the internal IP and return a 504.

**Large-video pipeline.** Videos are not transcoded inside the request. The admin uploads them presigned, directly to `upload.<domain>` under an `incoming/` prefix; a background job transcodes (ffmpeg → H.264 1080p, CRF 23, `+faststart`) and promotes them, swapping the URL everywhere. See §9.

---

## 2. Prerequisites

- A VPS (Ubuntu recommended) with a public IP, ports **80** and **443** open.
- Docker Engine + Compose plugin installed (`docker --version`, `docker compose version`).
- A registered domain you control the DNS for.
- A [Brevo](https://www.brevo.com/) account for transactional email (password reset):
  - a **REST API key** starting with `xkeysib-` (the SMTP key will **not** work), and
  - a **verified sender** email address.

---

## 3. DNS

Create six A records, all pointing at the VPS IP:

| Record            | Type | Cloudflare cloud (later)     |
| ----------------- | ---- | ---------------------------- |
| `<domain>` (apex) | A    | Orange (proxied)             |
| `www`             | A    | Orange (proxied)             |
| `admin`           | A    | Orange (proxied)             |
| `api`             | A    | Orange (proxied)             |
| `storage`         | A    | Orange (proxied — CDN cache) |
| `upload`          | A    | **Grey (DNS only)** ⚠️       |

> Deploy first with **all records grey (DNS-only)** so Traefik can obtain Let's Encrypt certificates directly. Switch apex/www/storage to orange **after** the first successful HTTPS load (§7). `upload` always stays grey.

---

## 4. Configure the server

```bash
# On the VPS
git clone <your-repo-url> flamingo && cd flamingo

# Create the production env file from the template
cp .env.production.example .env
nano .env    # fill in every value (see the reference in §11)
```

Generate strong secrets, e.g.:

```bash
openssl rand -base64 32   # use for JWT_SECRET, DB_PASSWORD, S3_SECRET_KEY, ADMIN_PASSWORD
```

`.env` is git-ignored. Never commit it.

---

## 5. Deploy

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

This will:

1. build the client and admin images (compiles the React site and Vue admin),
2. build the backend image (installs deps + ffmpeg, runs `prisma generate`),
3. start Postgres and MinIO, create the bucket (`minio-init`),
4. start the backend, which runs **`prisma migrate deploy`** automatically, then listens,
5. start Traefik, which requests Let's Encrypt certs on first HTTPS hit.

Watch it come up:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend traefik
```

Give Traefik a minute to issue certificates on the first request.

---

## 6. First-run: create the admin + default content

Migrations create the **schema** but no data. Seed the first admin account and the
default site config **once**:

```bash
docker compose -f docker-compose.prod.yml exec backend node prisma/seed.js
```

- The admin is created from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in your `.env`.
- Default multilingual site config (name, tagline, SEO, popup…) is inserted.
- A couple of **sample flash sales** are added on the first run only — delete them from the admin panel if you don't want them.
- The seed is **idempotent**: it never overwrites an existing admin or existing config, so re-running it is safe.

Then:

1. Open `https://admin.<domain>` and log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
2. Fill in real content (config, menu, spaces, gallery…).

> **Verify storage is reachable** (catches the multi-network 504 early):
>
> ```bash
> curl -I "https://storage.<domain>/flamingo/<some-uploaded-file>"   # expect 200/206, never 504
> ```

---

## 7. Put Cloudflare in front (recommended)

Serves media from Cloudflare's edge (fast worldwide) and caches JS/CSS/OG images.

1. Add the site to Cloudflare (Free plan), review the imported DNS records — **keep MX/TXT email records**.
2. At the registrar, switch the nameservers to Cloudflare's. Both old and new point at the same VPS, so there is no downtime.
3. Once the first HTTPS load worked directly, set the cloud state:
   - `<domain>`, `www`, `admin`, `api`, `storage` → **Orange (proxied)**
   - `upload` → **Grey (DNS only)** ⚠️ (leave it grey — this is the >100 MB upload path)
4. **SSL/TLS → Overview → Full (strict)**. Never use "Flexible" (redirect loops). Traefik's ACME renewal keeps working because Cloudflare passes `/.well-known/acme-challenge/` through.
5. **Caching → Cache Rules**: when **Hostname equals** `storage.<domain>` → **Eligible for cache**, **Edge TTL = use cache-control header** (uploads already send `immutable, max-age=31536000`).

Verify from the VPS (no corporate proxy there):

```bash
curl -I https://storage.<domain>/flamingo/<file>   # 1st: cf-cache-status: MISS, 2nd: HIT
```

> ⚠️ **Do not grey-cloud the apex/api to dodge the 100 MB cap.** The video pipeline already
> handles big files through the dedicated grey `upload.<domain>` host with a real Let's Encrypt cert.

---

## 8. Updating / redeploying

```bash
cd flamingo
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

- Frontend env/code is **baked at build time**, so a rebuild is required to pick up client/admin changes (`--build`).
- New DB migrations apply automatically on backend start (`prisma migrate deploy`).
- Only restart what changed if you prefer, e.g. `... up -d --build backend client admin`.

---

## 9. How large videos work (operational notes)

1. Admin picks a video → the browser requests a presigned PUT (`POST /api/upload/presign`) and uploads **directly** to `https://upload.<domain>` under `incoming/…`. The API server never holds the bytes.
2. Saving the entity triggers `POST /api/upload/process-incoming`. A **serialized** background job downloads the object, transcodes it (ffmpeg → H.264 1080p, CRF 23, AAC, `+faststart`), uploads the final key, swaps the temporary URL across all tables, and deletes the temp object.
3. While a video is processing, its URL still contains `/incoming/`. Public pages **hide** such media; the admin shows a "⏳ Traitement…" badge and auto-refreshes every 5 s. A **Relancer** button re-triggers processing if needed.
4. On backend start, a one-off reconciliation (5 s after boot) + a weekly sweep pick up anything left in `incoming/` by an interrupted deploy.

**Limits.** `PRESIGN_MAX_VIDEO_BYTES` (default 200 MB) caps presigned uploads. Because `upload.<domain>` is grey-clouded, Cloudflare's 100 MB cap does not apply to it. Keep source clips reasonable — a 1080p export is usually well under 100 MB.

---

## 10. Backups & maintenance

**Volumes to back up:** `pgdata` (database) and `miniodata` (uploaded media).

```bash
# Database dump
docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U "$DB_USER" "$DB_NAME" | gzip > backup-$(date +%F).sql.gz

# Media: back up the MinIO data volume
docker run --rm -v flamingo_miniodata:/data -v "$PWD":/backup alpine \
  tar czf /backup/media-$(date +%F).tar.gz -C /data .
```

Reset a lost admin password (creates/updates via the seed env vars):

```bash
# set a new ADMIN_PASSWORD in .env first, then:
docker compose -f docker-compose.prod.yml exec backend node prisma/seed.js
# (seed is create-only for an existing admin; to force a reset, delete the admin
#  row in the DB first, or change the password from the admin panel / forgot-password flow)
```

---

## 11. Environment variable reference (`.env`)

| Variable             | Example                          | Notes                                         |
| -------------------- | -------------------------------- | --------------------------------------------- |
| `DOMAIN`             | `flamingococobeach.com`          | Apex domain, no scheme.                       |
| `ACME_EMAIL`         | `admin@flamingococobeach.com`    | Let's Encrypt registration email.             |
| `DB_USER`            | `flamingo`                       | Postgres user.                                |
| `DB_PASSWORD`        | _(strong)_                       | Postgres password.                            |
| `DB_NAME`            | `flamingo`                       | Database name.                                |
| `S3_ACCESS_KEY`      | _(strong)_                       | MinIO root user.                              |
| `S3_SECRET_KEY`      | _(strong)_                       | MinIO root password.                          |
| `S3_BUCKET`          | `flamingo`                       | Bucket name (created by `minio-init`).        |
| `S3_REGION`          | `us-east-1`                      | Any value; MinIO ignores it.                  |
| `JWT_SECRET`         | _(long random)_                  | Signs admin/user JWTs.                        |
| `ADMIN_EMAIL`        | `admin@flamingococobeach.com`    | First admin login (used by `prisma/seed.js`). |
| `ADMIN_PASSWORD`     | _(strong)_                       | First admin password. Change after go-live.   |
| `BREVO_API_KEY`      | `xkeysib-…`                      | Brevo **REST** key (not SMTP).                |
| `BREVO_SENDER_EMAIL` | `no-reply@flamingococobeach.com` | Must be a **verified** Brevo sender.          |

Derived automatically by compose (no need to set): `DATABASE_URL`, `S3_ENDPOINT` (internal), `S3_PUBLIC_URL=https://storage.<domain>`, `S3_UPLOAD_URL=https://upload.<domain>`, `CORS_ORIGIN`, `CLIENT_URL`, `ADMIN_URL`.

---

## 12. Troubleshooting

| Symptom                                            | Likely cause / fix                                                                                                                           |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Login 504 / "CORS missing" on `/api`               | Multi-network routing — confirm `traefik.docker.network=flamingo_web` labels; check `docker compose logs backend`.                           |
| `storage.<domain>` 504 / media never loads         | Same multi-network label on `minio`; verify `curl -I https://storage.<domain>/…` is 200/206.                                                 |
| Video upload fails with a checksum/signature error | Already mitigated (`requestChecksumCalculation: "WHEN_REQUIRED"` on both S3 clients). If you bump `@aws-sdk`, keep that setting.             |
| Video upload CORS error in console                 | MinIO `MINIO_API_CORS_ALLOW_ORIGIN` must include `https://<domain>` (it does by default); restart `minio` after changing `.env`.             |
| Upload of a >100 MB file returns 413 (`cf-ray`)    | Cloudflare cap on a proxied host. Uploads must go to grey `upload.<domain>`; keep that record DNS-only, or compress the source under 100 MB. |
| Reset-password email "does nothing"                | Confirm the admin row exists (`SELECT id,email FROM admins;`) and Brevo uses the `xkeysib-` REST key with a verified sender.                 |
| Cert not issued                                    | Ports 80/443 open? DNS pointing at the VPS? For first issue, keep records grey (DNS-only), then switch to orange with SSL **Full (strict)**. |
| A video shows as a broken image                    | Should not happen — the client renders video URLs via `SmartMedia`. If you add a new media spot, use `<SmartMedia>` instead of `<img>`.      |
