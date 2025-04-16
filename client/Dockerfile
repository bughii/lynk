FROM node:20.11.1 AS build

# Build-time ARG
ARG VITE_SERVER_URL=http://localhost:9001
ENV VITE_SERVER_URL=$VITE_SERVER_URL

WORKDIR /app

COPY package*.json ./
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 4
RUN npm install || npm install --registry=https://registry.npmjs.org/ || npm ci

COPY . .


RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
