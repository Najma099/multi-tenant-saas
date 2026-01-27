import express from 'express';
import cors from 'cors';
import { originalUrl } from './config.js'
import router from './routes/index.js' 
import { errorHandler } from './middleware/error.middleware.js'
import { NotFoundError } from './core/ApiError.js'
import cookieParser from 'cookie-parser';
import helmet from 'helmet'


process.on('uncaughtExcaption', (e) => {
    logger.error(e);
})
export const app = express();

app.use(express.json({ limit: '10mb'}));
app.use(
    express.urlencoded({
        limit: '10mb',
        extended: true,
        parameterLimit: 50000
    })
);


app.use(cookiesParser());
app.use('/',router);
app.use((_req, _res, next) => {
    next(new NotFoundError());
})



