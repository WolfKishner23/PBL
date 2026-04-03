FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create logs and uploads directories
RUN mkdir -p logs uploads

EXPOSE 5000

CMD ["node", "server.js"]
