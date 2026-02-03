import { promisify } from 'util';
import { sign, verify, TokenExpiredError as JwtTokenExpiredError } from 'jsonwebtoken';
import { InternalError, BadTokenError, TokenExpiredError } from './ApiError';
import { tokenInfo } from '../config';

export class AccessTokenPayload {
  iss: string;
  aud: string;
  sub: string; 
  prm: string; 
  iat: number;
  exp: number;

  constructor(
    issuer: string,
    audience: string,
    userId: number,
    primaryKey: string,
    validity: number,
  ) {
    this.iss = issuer;
    this.aud = audience;
    this.sub = userId.toString();
    this.prm = primaryKey;
    this.iat = Math.floor(Date.now() / 1000);
    this.exp = this.iat + validity;
  }
}


export class RefreshTokenPayload {
  iss: string;
  aud: string;
  sub: string; // userId
  prm: string;
  iat: number;
  exp: number;

  constructor(
    issuer: string,
    audience: string,
    userId: number,
    secondaryKey: string,
    validity: number,
  ) {
    this.iss = issuer;
    this.aud = audience;
    this.sub = userId.toString();
    this.prm = secondaryKey;
    this.iat = Math.floor(Date.now() / 1000);
    this.exp = this.iat + validity;
  }
}


async function readPublicKey(): Promise<string> {
    return tokenInfo.jwtPublicKey;
}

async function readPrivateKey(): Promise<string> {
    return tokenInfo.jwtPrivateKey;
}

async function encode<T extends object>(payload: T): Promise<string> {
    const cert = await readPrivateKey();
    if (!cert) throw new InternalError('Token generation failure');
    //@ts-expect-error cert is valid
    return promisify(sign)(payload, cert, { algorithm: 'RS256' });
}

/**
 * This method checks the token and returns the decoded data when token is valid in all respect
 */
async function validate<T extends object>(token: string) {
    const cert = await readPublicKey();
    try {
        // @ts-expect-error cert is valid
        return (await promisify(verify)(token, cert)) as JwtPayload;
    } catch (e) {
        if (e instanceof JwtTokenExpiredError) {
            throw new TokenExpiredError();
        }
        throw new BadTokenError();
    }
}

/**
 * Returns the decoded payload if the signature is valid even if it is expired
 */
async function decode<T extends object>(token: string) {
    const cert = await readPublicKey();
    try {
        // @ts-expect-error cert is valid
        return (await promisify(verify)(token, cert)) as T;
    } catch (_e) {
        throw new BadTokenError();
    }
}

export default {
    encode,
    validate,
    decode,
};
