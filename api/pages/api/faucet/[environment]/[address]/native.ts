import { providers, Wallet, utils, errors } from "ethers";
import type { NextApiRequest, NextApiResponse } from "next";
import { DEFAULT_NATIVE_FUNDING_VALUE_IN_ETH } from "../../../../../utils/hopr";
import {
  getAddress,
  getWallet,
  getLockedTransaction,
  performTransaction,
} from "../../../../../utils/wallet";

type BalanceDataResponse = {
  hash?: string;
  err?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BalanceDataResponse | string>
) {
  const {
    method,
    query: { address, environment, text },
  } = req;

  if (method != "POST")
    return res.status(405).json({ err: "Only POST method allowed" });

  try {
    const { wallet, hoprTokenContract } = getWallet(environment);
    const addressToFund = getAddress(address);

    const faucetTx = {
      to: addressToFund,
      value: utils.parseEther(DEFAULT_NATIVE_FUNDING_VALUE_IN_ETH),
    };
    const lockedTx = await getLockedTransaction(faucetTx, wallet);
    const txConfirmed = await performTransaction(wallet, lockedTx, 3);

    if (text) return res.status(200).send(txConfirmed.transactionHash);
    return res.status(200).json({ hash: txConfirmed.transactionHash });
  } catch (err: any) {
    if (err.code == errors.INVALID_ARGUMENT) {
      return res.status(422).json({ err: "Address given is incorrect" });
    }
    console.log(err);
    return res.status(500).json({ err: "Unhandled error occurred" });
  }
}
