# Frontend Dockerfile - React App
FROM node:20-alpine AS builder

WORKDIR /app

# Build-Zeit Argumente
ARG REACT_APP_BACKEND_URL=http://localhost:8000
ARG REACT_APP_UNDER_DEVELOPMENT=false

# Alle package files kopieren
COPY package*.json ./

# Dependencies installieren
RUN npm install --legacy-peer-deps --force

# Source kopieren
COPY . .

# Environment fuer Build setzen
ENV CI=false
ENV DISABLE_ESLINT_PLUGIN=true
ENV SKIP_PREFLIGHT_CHECK=true
ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}
ENV REACT_APP_UNDER_DEVELOPMENT=${REACT_APP_UNDER_DEVELOPMENT}

# Build
RUN npm run build

# Production Stage mit Nginx
FROM nginx:alpine

# Nginx Config für SPA
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Build kopieren
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
