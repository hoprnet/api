import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ err: string }>
) {
  return res
    .status(401)
    .json({ err: "No faucet private key defined in server" });
}
