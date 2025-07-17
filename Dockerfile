FROM node:22-alpine

RUN apk add --no-cache \
    openssl \
    libc6-compat \
    python3 \
    make \
    g++

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
RUN npx prisma generate


# Copy the rest of the application
COPY . .

RUN pnpm build

# Expose port
EXPOSE 3000


COPY start.sh .
RUN chmod +x start.sh

# Start the application
CMD ["./start.sh"]