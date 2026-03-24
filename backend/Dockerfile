FROM node:22-slim

# Install Chromium for Puppeteer PDF generation
RUN apt-get update && apt-get install -y \
    chromium \
    wget \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src/ ./src/

RUN mkdir -p /app/uploads/generated

EXPOSE 5001

CMD ["node", "src/index.js"]
