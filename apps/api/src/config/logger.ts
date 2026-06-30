import winston from 'winston';
import { env } from './env';

const { combine, timestamp, json, colorize, printf } = winston.format;

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(timestamp(), json()),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        printf(({ level, message, timestamp }) => {
          return `${timestamp} ${level}: ${message}`;
        })
      ),
    })
  ],
});

export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
