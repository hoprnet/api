import { providers, Wallet, utils, errors, Contract } from "ethers";
import type { NextApiRequest, NextApiResponse } from "next";

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
    query: { address, tokenAddress },
    body: { secret },
  } = req;

  if (secret != process.env.FAUCET_SECRET_API_KEY)
    return res.status(401).json({ err: "No secret passed" });
  if (method != "POST")
    return res.status(405).json({ err: "Only POST method allowed" });

  try {
    const addressToFund = utils.getAddress(
      address instanceof Array ? address[0] : address
    );
    const tokenAddressContract = utils.getAddress(
      tokenAddress instanceof Array ? tokenAddress[0] : tokenAddress
    );

    const abi = ["function transfer(address to, uint amount) returns (bool)"];

    if (!process.env.FAUCET_RPC_PROVIDER)
      return res.status(501).json({ err: "No provider defined in server" });
    if (!process.env.FAUCET_SECRET_WALLET_PK)
      return res
        .status(501)
        .json({ err: "No faucet private key defined in server" });

    const provider = new providers.JsonRpcProvider(
      process.env.FAUCET_RPC_PROVIDER
    );
    const wallet = new Wallet(process.env.FAUCET_SECRET_WALLET_PK, provider);
    const hoprTokenContract = new Contract(tokenAddressContract, abi, wallet);

    const tx = await hoprTokenContract.transfer(
      addressToFund,
      utils.parseEther("5")
    );

    res.status(200).json({ hash: tx.hash });
  } catch (err: any) {
    if (err.code == errors.INVALID_ARGUMENT)
      return res
        .status(422)
        .json({ err: "At least one address given is incorrect" });
  }
}
