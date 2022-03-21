import type { NextApiRequest, NextApiResponse } from "next";
import { protocolConfig } from "../../../utils/protocol";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ err?: string } | typeof protocolConfig>
) {
  const { method } = req;

  if (method != "GET") {
    return res.status(405).json({ err: "Only GET method allowed" });
  }
  return res.status(200).json(protocolConfig as any);
}
