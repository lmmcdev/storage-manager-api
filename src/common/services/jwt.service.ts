import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { TokenPayload, AuthToken, User } from '../interfaces/auth.interface';

export class JwtService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    this.accessTokenSecret = env.JWT_ACCESS_SECRET || 'default-access-secret';
    this.refreshTokenSecret = env.JWT_REFRESH_SECRET || 'default-refresh-secret';
    this.accessTokenExpiry = env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = env.JWT_REFRESH_EXPIRY || '7d';
  }

  generateTokens(user: User): AuthToken {
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'storage-manager-api',
      audience: 'storage-manager-client',
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(
      { sub: user.id, jti: uuidv4() },
      this.refreshTokenSecret,
      {
        expiresIn: this.refreshTokenExpiry,
        issuer: 'storage-manager-api',
        audience: 'storage-manager-client',
      } as jwt.SignOptions
    );

    const decoded = jwt.decode(accessToken) as jwt.JwtPayload;
    const expiresIn = decoded.exp! - decoded.iat!;

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresIn * 1000, // Convert to milliseconds
      tokenType: 'Bearer',
    };
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'storage-manager-api',
        audience: 'storage-manager-client',
      }) as TokenPayload;

      return payload;
    } catch (error) {
      console.error('Invalid access token:', error);
      return null;
    }
  }

  verifyRefreshToken(token: string): jwt.JwtPayload | null {
    try {
      const payload = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'storage-manager-api',
        audience: 'storage-manager-client',
      }) as jwt.JwtPayload;

      return payload;
    } catch (error) {
      console.error('Invalid refresh token:', error);
      return null;
    }
  }

  refreshAccessToken(refreshToken: string, user: User): AuthToken | null {
    const payload = this.verifyRefreshToken(refreshToken);
    if (!payload || payload.sub !== user.id) {
      return null;
    }

    return this.generateTokens(user);
  }

  extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  getTokenExpiry(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as jwt.JwtPayload;
      if (!decoded || !decoded.exp) {
        return null;
      }

      return new Date(decoded.exp * 1000);
    } catch {
      return null;
    }
  }

  isTokenExpired(token: string): boolean {
    const expiry = this.getTokenExpiry(token);
    if (!expiry) {
      return true;
    }

    return expiry < new Date();
  }
}