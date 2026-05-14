FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY .npmrc package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .

EXPOSE 3001

CMD ["npx", "next", "dev", "-p", "3001"]
