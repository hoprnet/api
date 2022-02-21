import { providers, Wallet, utils, errors } from 'ethers';
import type { NextApiRequest, NextApiResponse } from 'next';
import protocolConfig from '../../../../../protocol-config.json';

type BalanceDataResponse = {
  hash?: string
  err?: string
}

type Environment = keyof typeof protocolConfig.environments;
type Networks = 'hardhat' | 'xdai' | 'goerli'

const isValidEnvironment = (type: string):type is Environment => {
  return (type in protocolConfig.environments)
}

const isValidNetwork = (type: string): type is Networks => {
  return (type in protocolConfig.networks)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BalanceDataResponse>
) {
  const { method, query: { address, environment }, body: { secret } } = req;

  if (secret != process.env.FAUCET_SECRET_API_KEY) return res.status(401).json({ err: 'No secret passed' })
  if (method != 'POST') return res.status(405).json({ err: 'Only POST method allowed' })

  try {
    const addressToFund = utils.getAddress(address instanceof Array ? address[0] : address)
    const actualEnvironment = environment instanceof Array ? environment[0] : environment
    
    if (!isValidEnvironment(actualEnvironment)) return res.status(501).json({ err: `Environment is invalid, try any of the following: ${Object.keys(protocolConfig.environments)}`})
    const network = protocolConfig.environments[actualEnvironment].network_id;
    
    if (!isValidNetwork(network)) return res.status(501).json({ err: `Environment ${actualEnvironment} has an invalid configurated network (${network}), please ensure the provided network by the environment exists`});
    const provider = new providers.JsonRpcProvider(protocolConfig.networks[network].default_provider)

    if (!process.env.FAUCET_SECRET_WALLET_PK) return res.status(501).json({ err: 'No faucet private key defined in server' })
    const wallet = new Wallet(process.env.FAUCET_SECRET_WALLET_PK, provider);

    const faucetTx = { to: addressToFund, value: utils.parseEther("0.01291") }
    const tx = await wallet.sendTransaction(faucetTx)

    res.status(200).json({ hash: tx.hash })

  } catch (err: any) {
    if (err.code == errors.INVALID_ARGUMENT) return res.status(422).json({ err: 'Address given is incorrect' })
  }
}
