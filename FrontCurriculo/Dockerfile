# ============================================================
# Stage 1: Build - Instala dependencias e gera o bundle
# ============================================================
FROM node:22-alpine AS build
WORKDIR /app

# Copia apenas package.json e package-lock.json para cache do Docker
COPY package*.json ./
RUN npm ci

# Copia resto do codigo e builda
COPY . .
RUN npm run build

# ============================================================
# Stage 2: Runtime - Nginx servindo arquivos estaticos
# ============================================================
FROM nginx:alpine AS final

# Remove configuracao padrao do Nginx
RUN rm -rf /usr/share/nginx/html/* \
    && rm -f /etc/nginx/conf.d/default.conf

# Copia configuracao customizada do Nginx (proxy reverso + SPA fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia arquivos buildados do Vite para a pasta raiz do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
