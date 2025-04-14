# Base image
FROM node:20.11.1-alpine

# Working directory
WORKDIR /app

# Package.json and package-lock.json
COPY package*.json ./

# Dependencies
RUN npm install

# Copy the application code
COPY . .

# Uploads directories 
RUN mkdir -p uploads/profiles uploads/files

# Port 
EXPOSE 9001

CMD ["node", "index.js"]