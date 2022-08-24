import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ err: string }>
) {
  return res
    .status(401)
    .json({ err: "No database to store nonces defined in server." });
}
