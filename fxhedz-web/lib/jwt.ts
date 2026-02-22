import jwt from "jsonwebtoken"

export function verifyAccessToken(req: Request) {
  const authHeader = req.headers.get("authorization")

  if (!authHeader?.startsWith("Bearer ")) return null

  const token = authHeader.replace("Bearer ", "")

  try {
    return jwt.verify(token, process.env.FXHEDZ_SECRET!)
  } catch {
    return null
  }
}