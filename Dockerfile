FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=10000

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server

EXPOSE 10000

CMD ["npm", "start"]
