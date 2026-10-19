FROM node:20-alpine

WORKDIR /app
COPY package.json ./
COPY bin ./bin
COPY lib ./lib
COPY web ./web

ENV PORT=8080
EXPOSE 8080

USER node
CMD ["node", "web/server.js"]
