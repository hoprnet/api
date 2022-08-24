import { ethers } from 'ethers'
import type { NextApiRequest, NextApiResponse } from 'next'

import { getWallet } from '../../../../utils/wallet'

type BalanceDataResponse = {
  address?: string
  err?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<BalanceDataResponse | string>) {
  const {
    method,
    query: { text }
  } = req

  if (method != 'GET') return res.status(405).json({ err: 'Only GET method allowed' })

  const { wallet } = getWallet()
  const address = await wallet.getAddress()

  if (text) return res.status(200).send(address)
  res.status(200).json({ address })
}
