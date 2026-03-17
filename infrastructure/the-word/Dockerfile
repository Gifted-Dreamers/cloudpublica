FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY dist/ ./dist/
COPY data/ ./data/
EXPOSE 3456
CMD ["node", "dist/src/server.js"]
