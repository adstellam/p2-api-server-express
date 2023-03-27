# syntax=docker/dockerfile:1
FROM node:14
ENV NODE_ENV=development
COPY package.json .
COPY package-lock.json .
RUN npm install
COPY . .
EXPOSE 9876
VOLUME /etc/ssl
ENTRYPOINT ["node", "bin/www"]
