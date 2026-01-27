import { Response } from 'express';

enum StatusCode{
    SUCCESS = '10000',
    FAILURE = '10001',
    RETRY = '10002',
    INVALID_ACCESS_TOKEN = '10003'
}

enum ResponseStatus{
    SUCCESS = 200,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    INTERNAL_ERROR = 500
}

abstract class ApiResponse {
    constructor(
        protected statusCode: StatusCode,
        protected status: ResponseStatus,
        protected message: String,
        protected success: boolean
    ) { }

    protected prepare< T extends ApiResponse> (
        res: Response,
        response: T,
        headers: { 
            [key: string]: string
        },
    ) : Response {
        for(const [key, value] of Object.entries(headers)) res.append(key, value);
        return res.status(this.status).json(ApiResponse.sanitize(response));
    }


    private static sanitize< T extends ApiResponse> (response: T): T {
        const clone: T = { } as T;
        Object.assign(clone, response);
        // @ts-expect-error: optional
        delete clone.status;
        for (const i in clone) if (typeof clone[i] === 'undefined') delete clone[i];
        return clone;
    }

    public send(
        res: Response,
        headers:{[key: string]: string} = {}
    ): Response {
        return this.prepare<ApiResponse>(res, this, headers)
    }
}

export class AuthFailureResponse extends ApiResponse {
    constructor(message: 'Authentication Failure', success: boolean = false) {
        super(StatusCode.FAILURE, ResponseStatus.UNAUTHORIZED, message, success)
    }
}

export class NotFoundResponse extends ApiResponse {
    constructor() {
        super()
    }
}

export class ForbiddenResponse extends ApiResponse {
    constructor(message: 'Bad Parameters', success: boolean = false) {
        super(StatusCode.FAILURE, ResponseStatus.FORBIDDEN, message, success);
    }
}

export class BadRequestResponse extends ApiResponse {
    constructor( message: 'Bad parameters', success: boolean = false) {
        super( StatusCode.)
    }
} 

