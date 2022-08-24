import { providers, Wallet, utils, errors, Contract } from 'ethers'
import type { NextApiRequest, NextApiResponse } from 'next'

import { getAddress, getWallet } from '../../../../../../utils/wallet'

type BalanceDataResponse = {
  hash?: string
  err?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<BalanceDataResponse>) {
  const {
    method,
    query: { address, tokenAddress }
  } = req

  if (method != 'POST') return res.status(405).json({ err: 'Only POST method allowed' })

  try {
    const { wallet, hoprTokenContract } = getWallet()
    const addressToFund = getAddress(address)

    const tx = await hoprTokenContract?.transfer(addressToFund, utils.parseEther('5'))

    return res.status(200).json({ hash: tx.hash })
  } catch (err: any) {
    if (err.code == errors.INVALID_ARGUMENT)
      return res.status(422).json({ err: 'At least one address given is incorrect' })
  }
}
