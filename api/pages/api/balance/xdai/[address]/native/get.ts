import { utils, providers, errors } from 'ethers';
import type { NextApiRequest, NextApiResponse } from 'next'

type BalanceDataResponse = {
  balance?: string
  err?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BalanceDataResponse | string>
) {
  const { method, query: { address, text } } = req;

  if (method != 'GET') return res.status(405).json({ err: 'Only GET method allowed' })
  if (!process.env.FAUCET_RPC_PROVIDER) return res.status(501).json({ err: 'No provider defined in server' })
  if (!process.env.FAUCET_SECRET_WALLET_PK) return res.status(501).json({ err: 'No faucet private key defined in server' })

  try {
    const addressToQuery = utils.getAddress(address instanceof Array ? address[0] : address)

    if (!process.env.FAUCET_RPC_PROVIDER) return res.status(501).json({ err: 'No provider defined in server' })
    if (!process.env.FAUCET_SECRET_WALLET_PK) return res.status(501).json({ err: 'No faucet private key defined in server' })

    const provider = new providers.JsonRpcProvider(process.env.FAUCET_RPC_PROVIDER);
    const balance = utils.formatEther(await provider.getBalance(addressToQuery))

    if (text) return res.status(200).send(balance)
    return res.status(200).json({ balance })

  } catch (err: any) {
    if (err.code == errors.INVALID_ARGUMENT) return res.status(422).json({ err: 'Address given is incorrect' })
  }
  
}
