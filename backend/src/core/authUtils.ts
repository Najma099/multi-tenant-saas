import { AuthFailureError, InternalError } from './ApiError';
import { ProtectedRequest, Tokens } from './../types/app-requests';
import JWT, { AccessTokenPayload, RefreshTokenPayload} from './jwtUtils';
import { tokenInfo } from './../config';
import brcyptjs from 'bcryptjs';
import { User } from '@prisma/client'

export const getAccessToken = (req: ProtectedRequest) => {
    const authHeader = req.headers.authorization;
    if(authHeader?.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }

    const cookieToken: string | undefined = req.cookies?.accessToken;
    if(cookieToken && cookieToken.trim().length > 0) {
        return cookieToken;
    }
    throw new AuthFailureError('Access Token Missing');
}


export const getRefreshedToken = (req: ProtectedRequest) => {
    if(req.body?.refreshToken) {
        return req.body.refreshToken;
    }

    if(req.cookies?.refreshToken) {
        return req.cookies.refreshToken;
    }
    throw new AuthFailureError('Refresh Token is missing');
}

export const validateAccessToken = (payload: AccessTokenPayload): boolean => {
  if (
    !payload ||
    payload.iss !== tokenInfo.issuer ||
    payload.aud !== tokenInfo.audience ||
    !/^\d+$/.test(payload.sub) ||
    !/^\d+$/.test(payload.tid) ||
    !/^\d+$/.test(payload.wid) ||
    !payload.role
  ) {
    throw new AuthFailureError('Invalid Access Token');
  }
  return true;
};

export const validateRefreshToken = (payload: RefreshTokenPayload): boolean => {
  if (
    !payload ||
    payload.iss !== tokenInfo.issuer ||
    payload.aud !== tokenInfo.audience ||
    !/^\d+$/.test(payload.sub) ||
    !/^\d+$/.test(payload.tid)
  ) {
    throw new AuthFailureError('Invalid Refresh Token');
  }
  return true;
};


export const createTokens = async (
  user: User,
  tenantId: number,
  workspaceId: number,
  role: 'ADMIN' | 'EDITOR' | 'VIEWER',
  accessTokenKey: string,
  refreshTokenKey: string,
): Promise<Tokens> => {

  const accessToken = await JWT.encode(
    new AccessTokenPayload(
      tokenInfo.issuer,
      tokenInfo.audience,
      user.id,
      tenantId,
      workspaceId,
      role,
      tokenInfo.accessTokenValidity,
    ),
  );

  if (!accessToken) throw new InternalError();

  const refreshToken = await JWT.encode(
    new RefreshTokenPayload(
      tokenInfo.issuer,
      tokenInfo.audience,
      user.id,
      tenantId,
      tokenInfo.refreshTokenValidity,
    ),
  );

  if (!refreshToken) throw new InternalError();

  return { accessToken, refreshToken };
};


export const isPasswordCorrect = async function (userPassword: string, hashedPassword: string) {
    return await brcyptjs.compare(userPassword, hashedPassword);
};
