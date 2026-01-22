FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm i --production

COPY . .

RUN npm run build

FROM nginx:1.23.1-alpine

COPY --from=build /app/dist/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
