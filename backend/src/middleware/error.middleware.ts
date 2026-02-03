import { NextFunction, Request, Response } from 'express';
import { isProduction } from './../config';
import { ApiError, ErrorType } from './../core/ApiError';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction,
) => {
    let statusCode = 500;
    let message = 'Something went wrong';
    const errors: string[] = [];

    console.error('Error:', err);

    if (err instanceof ApiError) {
        ApiError.handle(err, res);
        return;
    }

    if (!isProduction) {
        message = err?.message || message;
        errors.push(err?.message);
    }

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        ...(errors.length > 0 && !isProduction && { errors }),
        timeStamp: new Date().toISOString(),
        path: req.originalUrl,
    });
};
