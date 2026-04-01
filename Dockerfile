# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 3002
# Only substitute $SPORTS_API_KEY — preserves nginx variables like $uri, $remote_addr
ENV NGINX_ENVSUBST_FILTER="SPORTS_API_KEY"
CMD ["nginx", "-g", "daemon off;"]
