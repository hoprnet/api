import { providers, Wallet, utils, errors, Contract, BigNumber } from "ethers";
import type { NextApiRequest, NextApiResponse } from "next";
import { DEFAULT_NATIVE_FUNDING_VALUE_IN_ETH } from "../../../../../utils/hopr";
import {
  isValidEnvironment,
  protocolConfig,
  isValidNetwork,
} from "../../../../../utils/protocol";
import { getLockedTransaction } from "../../../../../utils/wallet";

type BalanceDataResponse = {
  balance?: string;
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

  if (method != "GET")
    return res.status(405).json({ err: "Only GET method allowed" });

  try {
    const addressToQuery = utils.getAddress(
      address instanceof Array ? address[0] : address
    );
    const actualEnvironment =
      environment instanceof Array ? environment[0] : environment;
    const abi = ["function balanceOf(address) view returns (uint)"];

    if (!isValidEnvironment(actualEnvironment))
      return res
        .status(501)
        .json({
          err: `Environment is invalid, try any of the following: ${Object.keys(
            protocolConfig.environments
          )}`,
        });
    const network = protocolConfig.environments[actualEnvironment].network_id;

    if (!isValidNetwork(network))
      return res
        .status(501)
        .json({
          err: `Environment ${actualEnvironment} has an invalid configurated network (${network}), please ensure the provided network by the environment exists`,
        });
    const provider = new providers.JsonRpcProvider(
      protocolConfig.networks[network].default_provider
    );

    const tokenAddressContract =
      protocolConfig.environments[actualEnvironment].token_contract_address;
    const hoprTokenContract = new Contract(tokenAddressContract, abi, provider);

    const balance = utils.formatEther(
      (await hoprTokenContract.balanceOf(addressToQuery)) as BigNumber
    );

    if (text) return res.status(200).send(balance);
    res.status(200).json({ balance });
  } catch (err: any) {
    if (err.code == errors.INVALID_ARGUMENT)
      return res.status(422).json({ err: "Address given is incorrect" });
  }
}
