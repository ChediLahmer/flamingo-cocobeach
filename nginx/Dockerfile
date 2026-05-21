FROM node:22-alpine AS client-build
WORKDIR /app
COPY client/package.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:22-alpine AS admin-build
WORKDIR /app
COPY admin/package.json ./
RUN npm install
COPY admin/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=client-build /app/dist /usr/share/nginx/html
COPY --from=admin-build /app/dist /usr/share/nginx/admin
COPY nginx/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
