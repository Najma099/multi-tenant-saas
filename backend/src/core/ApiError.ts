import { Response } from 'express';
import { isProduction } from '../config';
import { AuthFailureResponse, AccessTokenErrorResponse, InternalErrorResponse,NotFoundResponse, BadRequestResponse, ForbiddenResponse } from './ApiResponse'

export enum ErrorType {
    BAD_ERROR = 'BadTokenError',
    TOKEN_EXPIRED = 'TokenExpiredError',
    UNAUTHORIZED = 'AuthFailureError',
    ACCESS_TOKEN = 'AccessTokenError',
    INTERNAL = 'InternalError',
    NOT_FOUND = 'NotFoundError',
    NO_ENTRY = 'NoEntryError',
    NO_DATA = 'NoDataError',
    BAD_REQUEST = 'BadRequestError',
    FORBIDDEN = 'ForbiddenError'
}

export abstract class ApiError extends Error {
    constructor(
        public type: ErrorType,
        public message: string = 'error'
    ) {
        super(type);
    }

    public static handle(err: ApiError, res: Response): Response {
        switch(err.type) {
            case ErrorType.BAD_ERROR:
            case ErrorType.TOKEN_EXPIRED:
            case ErrorType.UNAUTHORIZED:
                return new AuthFailureResponse(err.message, false).send(res);
            case ErrorType.ACCESS_TOKEN:
                return new AccessTokenErrorResponse(err.message,false).send(res);
            case ErrorType.NOT_FOUND:
            case ErrorType.NO_DATA:
            case ErrorType.NO_ENTRY:
                return new NotFoundResponse(err.message, false).send(res);
            case ErrorType.BAD_REQUEST:
                return new BadRequestResponse(err.message, false).send(res);
            case ErrorType.FORBIDDEN:
                return new ForbiddenResponse(err.message, false).send(res);
            default: {
                let message = err.message;
                if(isProduction) {
                    message = 'Something happened wrong';
                }
                return new InternalErrorResponse(message, false).send(res);
            }
        }
    }
}

export class AuthFailureError extends ApiError {
    constructor(message = 'Invalid Credentials') {
        super(ErrorType.UNAUTHORIZED, message);
    }
}

export class InternalError extends ApiError {
    constructor(message = 'Internal Error') {
        super(ErrorType.INTERNAL, message);
    }
}

export class BadRequestError extends ApiError {
    constructor(message = 'Bad Request') {
        super(ErrorType.BAD_REQUEST, message);
    }
}

export class NotFoundError extends ApiError {
    constructor(message = 'Not Found') {
        super(ErrorType.NOT_FOUND, message);
    }
}

export class ForbiddenError extends ApiError {
    constructor(message = 'Permission denied') {
        super(ErrorType.FORBIDDEN, message);
    }
}

export class NoEntryError extends ApiError {
  constructor(message = "Entry don't exists") {
    super(ErrorType.NO_ENTRY, message);
  }
}

export class BadTokenError extends ApiError {
    constructor(message = 'Token not valid') {
        super(ErrorType.BAD_REQUEST, message);
    }
}

export class TokenExpiredError extends ApiError {
    constructor(message = 'Token expired') {
        super(ErrorType.TOKEN_EXPIRED, message);
    }
}

export class NoDataError extends ApiError {
    constructor(message = 'No data avaiable') {
        super(ErrorType.NO_DATA, message);
    }
}

export class AccessTokenError extends ApiError {
    constructor(message = 'Invalid access Token') {
        super(ErrorType.ACCESS_TOKEN, message);
    }
}