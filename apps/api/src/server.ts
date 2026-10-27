import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pino from 'pino';
import pinoHttp from 'pino-http';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.routes';
import { workspaceRouter } from './routes/workspace.routes';

dotenv.config();

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: { colorize: true },
        }
      : undefined,
});

export const app = express();
const port = parseInt(process.env.PORT || '4000', 10);

// Security & Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.WEB_APP_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Workspace-Id', 'X-Requested-With'],
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === '/health',
    },
  })
);

// Health Endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'zdoda-api',
  });
});

// Mount API v1 Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/workspaces', workspaceRouter);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
  });
});

// Centralized Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err, 'Unhandled API Error');
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
    },
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    logger.info(`🚀 Zdoda API server running on http://localhost:${port}`);
  });
}
