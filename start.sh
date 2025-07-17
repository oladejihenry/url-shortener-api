#!/bin/sh
# start.sh

# Run migrations
pnpm prisma:migrate

# Start the application
exec pnpm start