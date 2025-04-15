import dbPool from "./database/dbConfig";
import logger from "./utils/logger";
import { config } from "./config/config";

const WEBZ_API_TOKEN = config.webzIo.apiKey;
const WEBZ_API_BASE_URL = config.webzIo.baseUrl;

if (!WEBZ_API_TOKEN) {
  logger.error("WEBZ_API_TOKEN environment variable is required");
  process.exit(1);
}

console.log("Project setup is working! Ready for Webz.io Data Fetcher.");
