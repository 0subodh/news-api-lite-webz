import { createLogger, format, transports } from "winston";

const logFormat = format.printf(({ level, message, timestamp, ...meta }) => {
  const args = (meta[Symbol.for("splat")] as any[]) ?? [];
  const argsString = args.length > 0 ? " " + args.join(" ") : "";
  return `[${level.toUpperCase()}] ${timestamp} - ${message}${argsString}`;
});

const logger = createLogger({
  level: "debug",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DDTHH:mm:ss.SSSZ" }),
    logFormat
  ),
  transports: [
    new transports.File({
      filename: "webzAPI.log",
      maxsize: 5242880,
      maxFiles: 5, // Keep up to 5 rotated files
      tailable: true, // Rotate by renaming
    }),
    new transports.Console(),
  ],
});

export default {
  info: (message: string, ...args: any[]) => logger.info(message, ...args),
  error: (message: string, ...args: any[]) => logger.error(message, ...args),
  warn: (message: string, ...args: any[]) => logger.warn(message, ...args),
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== "production") {
      logger.debug(message, ...args);
    }
  },
};
