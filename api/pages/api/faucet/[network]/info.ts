import { providers, Wallet, utils, errors, Contract, BigNumber } from 'ethers'
import type { NextApiRequest, NextApiResponse } from 'next'
import { getWallet } from '../../../../utils/wallet'

type BalanceDataResponse = {
  address?: string
  balance?: {
    native: string
    hopr: string
  }
  err?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<BalanceDataResponse | string>) {
  const {
    method,
    query: { network, text }
  } = req

  if (method != 'GET') return res.status(405).json({ err: 'Only GET method allowed' })

  try {
    const { wallet, hoprTokenContract } = getWallet(network)
    const address = await wallet.getAddress()

    const native = utils.formatEther(await wallet.getBalance())
    const hopr = utils.formatEther((await hoprTokenContract?.balanceOf(address)) as BigNumber)

    if (text) {
      if (text == 'native') return res.status(200).send(native)
      if (text == 'hopr') return res.status(200).send(hopr)
      if (text == 'address') return res.status(200).send(address)
    }
    return res.status(200).json({ address, balance: { native, hopr } })
  } catch (err: any) {
    if (err.code == errors.INVALID_ARGUMENT) return res.status(422).json({ err: 'Address given is incorrect' })
  }
}
