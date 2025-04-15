# Webz.io Data Fetcher

A TypeScript service that connects to the Webz.io News API, fetches articles, and stores them in a PostgreSQL database.

## Features

- Fetches news articles from the Webz.io News API
- Stores articles and related data in a PostgreSQL database
- Implements the Builder pattern for flexible query construction
- Includes comprehensive unit tests

## Requirements

- Node.js 20+
- Docker and Docker Compose (for running with PostgreSQL)

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=webz_data
DB_USER=postgres
DB_PASSWORD=postgres
WEBZ_API_TOKEN=your-webz-api-token
WEBZ_API_BASE_URL=https://api.webz.io
```

## Running with Docker Compose

The easiest way to run the application is with Docker Compose:

`docker compose up`

This will:

1. Start a PostgreSQL container
2. Build and start the application container
   3 .Connect to the Webz.io API and fetch data based on the default query

## Final Setup and Running Instructions

To run the project:

1. Create all the files as shown above
2. Run `npm install` to install dependencies
3. Run `docker compose up` to start the PostgreSQL database and the application

The application will:

1. Connect to the Webz.io API using the provided token
2. Fetch news articles using the 'technology' query (configurable)
3. Save the articles to the PostgreSQL database
4. Continue fetching additional pages of results until all available articles are retrieved
5. Output the count of retrieved articles and the total available

## Possible Improvements