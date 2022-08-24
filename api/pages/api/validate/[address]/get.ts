import { utils } from "ethers";
import type { NextApiRequest, NextApiResponse } from "next";

import { getAddress } from "../../../../utils/wallet";

type BalanceDataResponse = {
  isValid?: boolean;
  err?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BalanceDataResponse | boolean>
) {
  const {
    method,
    query: { address, text },
  } = req;

  if (method != "GET")
    return res.status(405).json({ err: "Only GET method allowed" });

  try {
    getAddress(address);
    if (text) return res.status(200).send(true);
    return res.status(200).json({ isValid: true });
  } catch (err: any) {
    if (text) return res.status(200).send(false);
    return res.status(200).json({ isValid: false });
  }
}
