# URL Shortener

## Description

This is a URL shortener built with Node.js, Express, Prisma, Redis, JWT, Zod, Nanoid, Docker, Docker Compose, and PostgreSQL.

## Features

- Shorten URLs
- Redirect to the long URL
- Get the stats for a short URL
- Get the URLs for a user

## Tech Stack

- Node.js
- Express
- Prisma
- Redis
- JWT
- Zod
- Nanoid
- Docker
- Docker Compose
- PostgreSQL

## Setup

1. Clone the repository
2. Run `docker-compose up -d` to start the services
3. Copy the `.env.example` file to `.env` and fill in the values
4. Run `npm install` to install the dependencies
5. Run `npm run dev` to start the server

## Environment Variables

- `PORT` - The port to run the server on
- `DATABASE_URL` - The URL to connect to the database
- `REDIS_URL` - The URL to connect to the Redis server
- `JWT_SECRET` - The secret to sign the JWT tokens

## Usage

1. Go to `http://localhost:3000` to see the app
