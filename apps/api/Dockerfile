FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY tsconfig.base.json ./
COPY apps/api/package*.json apps/api/
COPY apps/database/package*.json apps/database/
RUN npm install

FROM deps AS build
COPY . .
RUN npm run --workspace apps/database generate
RUN npm run --workspace apps/api build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
CMD ["node", "apps/api/dist/server.js"]
