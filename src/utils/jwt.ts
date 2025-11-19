import jwt_decode from "jwt-decode";

interface JWTPayload {
  exp?: number;
  [key: string]: unknown;
}

class JWTToken {
  static getDecodeToken(token: string) {
    return jwt_decode(token);
  }

  static getExpiryTime(token: string): number | undefined {
    const jwt = jwt_decode<JWTPayload>(token);
    return jwt.exp;
  }

  static isTokenExpired(token: string): boolean {
    const jwt = jwt_decode<JWTPayload>(token);
    const expiryTime = jwt.exp;
    if (expiryTime) {
      return 1000 * expiryTime - new Date().getTime() < 5000;
    } else {
      return false;
    }
  }
}

export default JWTToken;
