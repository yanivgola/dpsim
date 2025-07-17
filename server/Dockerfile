# Stage 1: Build the TypeScript application
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm ci
COPY . .
RUN npx tsc

# Stage 2: Run the application
FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
# We also need to copy assets that the server needs at runtime
COPY --from=build /app/public/assets ./public/assets

EXPOSE 3001
CMD ["node", "dist/index.js"]
