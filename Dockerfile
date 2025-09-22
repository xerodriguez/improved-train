FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.lock ./

RUN npm i 

COPY . .

EXPOSE 3000