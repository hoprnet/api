import { utils, errors, BigNumber } from 'ethers'
import type { NextApiRequest, NextApiResponse } from 'next'
import { getAddress, getWallet } from '../../../../../utils/wallet'

type BalanceDataResponse = {
  balance?: string
  err?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<BalanceDataResponse | string>) {
  const {
    method,
    query: { network, address, text }
  } = req

  if (method != 'GET') return res.status(405).json({ err: 'Only GET method allowed' })

  try {
    const { hoprTokenContract } = getWallet(network)
    const addressToQuery = getAddress(address)

    const start = Date.now()
    const balance = utils.formatEther((await hoprTokenContract?.balanceOf(addressToQuery)) as BigNumber)
    const end = Date.now()
    const timeElapsed = end - start
    console.log(`Fetched HOPR balance for ${addressToQuery} in ${timeElapsed}ms`)

    if (text) return res.status(200).send(balance)
    return res.status(200).json({ balance })
  } catch (err: any) {
    if (err.code == errors.INVALID_ARGUMENT) return res.status(422).json({ err: 'Address given is incorrect' })
  }
}
