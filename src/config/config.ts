import dotenv from "dotenv";

dotenv.config(); //

export const config = {
  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    databaseName: process.env.DB_NAME || "webz_data",
  },
  webzIo: {
    apiKey: process.env.WEBZIO_API_TOKEN || "YOUR_WEBZIO_API_KEY",
    baseUrl: process.env.WEBZ_API_BASE_URL || "https://api.webz.io/newsApiLite",
  },
};
