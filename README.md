# Flamingo Coucou Beach

A showcase ("vitrine") website for Flamingo Coucou Beach — fun, alive, and energetic.

## Architecture

- **backend/** — Fastify API (Node.js ES Modules) + PostgreSQL (Prisma ORM) + S3/MinIO
- **admin/** — Vue 3 admin backoffice (Vite + Tailwind)
- **client/** — Public showcase site (Vite + React + Framer Motion + GSAP)

## Deployment

Production deployment (single VPS, Traefik + HTTPS, MinIO, optional Cloudflare CDN,
async large-video pipeline) is documented in **[DEPLOYMENT.md](DEPLOYMENT.md)**.

## Admin Features

- Media management (upload images/videos)
- Menu / Carte management
- Espace / Galerie management
- Site configuration

## Development

```bash
# Install all dependencies
npm install
cd backend && npm install
cd ../admin && npm install
cd ../client && npm install

# Start all services
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
DATABASE_URL=postgresql://user:password@localhost:5432/flamingo_coucoubeach
JWT_SECRET=your-secret-key
S3_ENDPOINT=http://localhost:9100
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=flamingo
S3_PUBLIC_URL=http://localhost:9100
S3_REGION=us-east-1
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
PORT=3000
```
