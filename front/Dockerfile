FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm i --production

COPY . .

RUN npm run build

FROM node:20-alpine AS dev

WORKDIR /app

COPY package*.json ./

RUN npm i

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]

FROM nginx:1.23.1-alpine

COPY --from=build /app/dist/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
