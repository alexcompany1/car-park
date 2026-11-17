FROM node:24-bookworm-slim@sha256:01d566e8d94d8c619591d78652babfccd3c6992a3dffa9ed5ab39e11cf6c70e9
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server.js index.html ./
COPY src ./src
COPY api ./api
COPY CarPark-FUNCIONA ./CarPark-FUNCIONA
COPY css ./css
COPY js ./js
COPY lab-backups/scripts/api-entrypoint.sh /usr/local/bin/carpark-lab-api
USER node
EXPOSE 3000
ENTRYPOINT ["sh", "/usr/local/bin/carpark-lab-api"]

