import { providers, Wallet, utils, errors } from "ethers";
import type { NextApiRequest, NextApiResponse } from "next";
import { DEFAULT_NATIVE_FUNDING_VALUE_IN_ETH } from "../../../../../../utils/hopr";

import { getAddress, getWallet } from "../../../../../../utils/wallet";

type BalanceDataResponse = {
  hash?: string;
  err?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BalanceDataResponse>
) {
  const {
    method,
    query: { address },
  } = req;

  if (method != "POST")
    return res.status(405).json({ err: "Only POST method allowed" });

  try {
    const { wallet } = getWallet();
    const addressToFund = getAddress(address);

    const faucetTx = {
      to: addressToFund,
      value: utils.parseEther(DEFAULT_NATIVE_FUNDING_VALUE_IN_ETH),
    };
    const tx = await wallet.sendTransaction(faucetTx);

    return res.status(200).json({ hash: tx.hash });
  } catch (err: any) {
    if (err.code == errors.INVALID_ARGUMENT)
      return res.status(422).json({ err: "Address given is incorrect" });
  }
}
