import { providers, Wallet, utils, errors } from 'ethers'
import type { NextApiRequest, NextApiResponse } from 'next'
import { DEFAULT_NATIVE_FUNDING_VALUE_IN_ETH } from '../../../../../utils/hopr'
import { getAddress, getWallet, getLockedTransaction } from '../../../../../utils/wallet'

type BalanceDataResponse = {
  balance?: string
  err?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<BalanceDataResponse | string>) {
  const {
    method,
    query: { address, environment, text }
  } = req

  if (method != 'GET') return res.status(405).json({ err: 'Only GET method allowed' })

  try {
    const { wallet } = getWallet(environment)
    const addressToQuery = getAddress(address)

    const balance = utils.formatEther(await wallet.provider.getBalance(addressToQuery))

    if (text) return res.status(200).send(balance)
    return res.status(200).json({ balance })
  } catch (err: any) {
    if (err.code == errors.INVALID_ARGUMENT) return res.status(422).json({ err: 'Address given is incorrect' })
  }
}
