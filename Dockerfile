FROM node:23.7.0-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

COPY . .
RUN npm run build

FROM node:23.7.0-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY package*.json ./

RUN npm install --only=production --omit=dev

CMD ["node", "dist/main"]