FROM oven/bun:1.4.4

WORKDIR /app
COPY package.json package.json
RUN bun install

COPY . .
RUN bun run build

EXPOSE 3000
ENTRYPOINT ["bun", "./build"]