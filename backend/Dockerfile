FROM node:22-alpine AS base
# ffmpeg is required by src/lib/media.js for video transcoding.
RUN apk add --no-cache python3 make g++ ffmpeg
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
