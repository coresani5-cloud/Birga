FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ ffmpeg && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV NODE_ENV=production DATA_DIR=/data/db UPLOAD_DIR=/data/uploads PORT=3000
VOLUME /data
EXPOSE 3000
CMD ["node", "server.txt"]
