import winston from 'winston';
import morgan from 'morgan';
import { env } from './env';

const { combine, timestamp, json, colorize, printf } = winston.format;

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(timestamp(), json()),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(
        colorize(),
        printf(({ level, message, timestamp }) => {
          return `${timestamp} ${level}: ${message}`;
        })
      ),
    })
  );
} else {
  logger.add(new winston.transports.Console());
}

export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
