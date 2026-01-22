FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm i --production

EXPOSE 3000

CMD ["npm", "start"]
