import { SignJWT, jwtVerify } from "jose";

export type AppJwtPayload = {
  sub: string;
};

export const signAppJwt = async (secret: string, payload: AppJwtPayload): Promise<string> => {
  const key = new TextEncoder().encode(secret);

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
};

export const verifyAppJwt = async (secret: string, token: string): Promise<AppJwtPayload> => {
  const key = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify<AppJwtPayload>(token, key);

  return { sub: payload.sub as string };
};
