FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ libc6-compat

COPY package*.json ./
# sequelize-cli currently lives in devDependencies but is required by the
# container entrypoint to apply migrations before the API starts.
RUN npm ci

COPY . .
RUN mkdir -p uploads/announcements

EXPOSE 4000

CMD ["sh", "-c", "npx sequelize-cli db:migrate && npm start"]
