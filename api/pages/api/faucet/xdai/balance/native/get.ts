import { ethers } from "ethers";
import type { NextApiRequest, NextApiResponse } from "next";

type BalanceDataResponse = {
  balance?: string;
  err?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BalanceDataResponse>
) {
  const { method } = req;

  if (method != "GET")
    return res.status(405).json({ err: "Only GET method allowed" });

  const { wallet } = getWallet();
  const balance = ethers.utils.formatEther(await wallet.getBalance());

  return res.status(200).json({ balance });
}
