import { ethers } from 'ethers';
import type { NextApiRequest, NextApiResponse } from 'next'

type BalanceDataResponse = {
  balance?: string
  err?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BalanceDataResponse>
) {
  const { method } = req;

  if (method != 'GET') return res.status(405).json({ err: 'Only GET method allowed' })
  if (!process.env.FAUCET_RPC_PROVIDER) return res.status(501).json({ err: 'No provider defined in server' })
  if (!process.env.FAUCET_SECRET_WALLET_PK) return res.status(501).json({ err: 'No faucet private key defined in server' })

  const provider = new ethers.providers.JsonRpcProvider(process.env.FAUCET_RPC_PROVIDER);
  const wallet = new ethers.Wallet(process.env.FAUCET_SECRET_WALLET_PK, provider);
  const balance = ethers.utils.formatEther(await wallet.getBalance())

  res.status(200).json({ balance })
}
