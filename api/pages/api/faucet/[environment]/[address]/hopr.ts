import { providers, Wallet, utils, errors, Contract } from "ethers";
import type { NextApiRequest, NextApiResponse } from "next";
import { DEFAULT_HOPR_FUNDING_VALUE } from "../../../../../utils/hopr";
import {
  isValidEnvironment,
  protocolConfig,
  isValidNetwork,
} from "../../../../../utils/protocol";
import {
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
    body: { secret },
  } = req;

    if (method != "POST")
    return res.status(405).json({ err: "Only POST method allowed" });

  try {
    const { wallet, hoprTokenContract } = getWallet(environment);
    const addressToFund = utils.getAddress(
      address instanceof Array ? address[0] : address
    );

    const faucetTx = await hoprTokenContract.populateTransaction.transfer(
      addressToFund,
      utils.parseEther(DEFAULT_HOPR_FUNDING_VALUE)
    );
    const lockedTx = await getLockedTransaction(
      faucetTx,
      wallet,
      network,
      provider
    );
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
