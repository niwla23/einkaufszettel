FROM node:22.14-alpine AS builder

WORKDIR /app
RUN npm i -g pnpm@8.6

COPY . .

RUN pnpm install
RUN pnpm build
RUN pnpm prune --production


FROM node:22.14-alpine
WORKDIR /app
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .
EXPOSE 80
ENV HOST=0.0.0.0 PORT=80 NODE_ENV=production

CMD ["node", "build"]


