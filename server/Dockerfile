FROM node:20.11.1-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p uploads/profiles uploads/files

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:9001/api/health || exit 1

EXPOSE 9001
CMD ["node", "index.js"]