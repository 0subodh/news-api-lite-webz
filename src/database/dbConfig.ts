import { Pool, PoolConfig } from "pg";
import { config } from "../config/config";
import logger from "../utils/logger";

const dbConfig: PoolConfig = {
  user: config.database.username || "postgres",
  password: config.database.password || "postgres",
  host: config.database.host || "localhost",
  port: config.database.port || 5432,
  database: config.database.databaseName || "webz_data",
};

const pool = new Pool(dbConfig);

// test the connection
pool.on("connect", () => {
  logger.info("Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  logger.error("PostgreSQL connection error:", err);
  process.exit(-1);
});

export default pool;
