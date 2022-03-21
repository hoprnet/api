import { providers, Wallet, utils, errors, Contract, BigNumber } from 'ethers';
import type { NextApiRequest, NextApiResponse } from 'next';
import { isValidEnvironment, protocolConfig, isValidNetwork } from '../../../../utils/protocol';

type BalanceDataResponse = {
  address?: string
  balance?: {
    native: string,
    hopr: string
  }
  err?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BalanceDataResponse | string>
) {
  const { method, query: { environment, text } } = req;

  if (method != 'GET') return res.status(405).json({ err: 'Only GET method allowed' })

  try {
    const actualEnvironment = environment instanceof Array ? environment[0] : environment
    const abi = ["function balanceOf(address) view returns (uint)"];

    if (!isValidEnvironment(actualEnvironment)) return res.status(501).json({ err: `Environment is invalid, try any of the following: ${Object.keys(protocolConfig.environments)}`})
    const network = protocolConfig.environments[actualEnvironment].network_id;
    
    if (!isValidNetwork(network)) return res.status(501).json({ err: `Environment ${actualEnvironment} has an invalid configurated network (${network}), please ensure the provided network by the environment exists`});
    const provider = new providers.JsonRpcProvider(protocolConfig.networks[network].default_provider)

    if (!process.env.FAUCET_SECRET_WALLET_PK) return res.status(501).json({ err: 'No faucet private key defined in server' })
    const wallet = new Wallet(process.env.FAUCET_SECRET_WALLET_PK, provider);
    
    const tokenAddressContract = protocolConfig.environments[actualEnvironment].token_contract_address
    const hoprTokenContract = new Contract(tokenAddressContract, abi, provider);
    const address = await wallet.getAddress();

    const native = utils.formatEther(await wallet.getBalance());
    const hopr = utils.formatEther((await hoprTokenContract.balanceOf(address) as BigNumber));

    if (text) {
      if (text == 'native') return res.status(200).send(native);
      if (text == 'hopr') return res.status(200).send(hopr);
      if (text == 'address') return res.status(200).send(address);
    }
    res.status(200).json({ address, balance: { native, hopr } })

  } catch (err: any) {
    if (err.code == errors.INVALID_ARGUMENT) return res.status(422).json({ err: 'Address given is incorrect' })
  }
}
