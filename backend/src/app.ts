import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { originUrl } from './config';
import router from './routes/index';
import { errorHandler } from './middleware/error.middleware';
import { NotFoundError } from './core/ApiError';



process.on('uncaughtException', (err) => {
  console.log(err);
  process.exit(1);
});

export const app = express();


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true, parameterLimit: 50000 }));

app.use(cors({
  origin: originUrl,
  credentials: true,
  optionsSuccessStatus: 200,
}));

app.use(cookieParser());
app.use(helmet());


app.use('/api/v1', router);
app.use((_req, _res, next) => next(new NotFoundError()));
app.use(errorHandler);
