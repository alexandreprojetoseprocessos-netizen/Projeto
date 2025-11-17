FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY tsconfig.base.json ./
COPY apps/front/package*.json apps/front/
RUN npm install

FROM deps AS build
COPY . .
RUN npm run --workspace apps/front build

FROM nginx:1.27-alpine
COPY --from=build /app/apps/front/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
