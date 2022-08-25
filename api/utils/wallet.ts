import { providers, errors, utils, BigNumber, Wallet, Contract } from 'ethers'
import Redis from 'ioredis'

import type { Signer } from '@ethersproject/abstract-signer'
import type { TransactionRequest, TransactionReceipt } from '@ethersproject/abstract-provider'

import { isValidEnvironment, isValidNetwork, getEnvironment, getNetwork } from './protocol'

const { FAUCET_REDIS_URL, FAUCET_RPC_PROVIDER, FAUCET_SECRET_WALLET_PK } = process.env

export function getAddress(address?: string | string[]) {
  if (address) {
    const actualAddress = address instanceof Array ? address[0] : address
    const addressToFund = utils.getAddress(actualAddress)
    return addressToFund
  }
  throw new Error("Missing parameter 'address'")
}

export function getWallet(environment?: string | string[]) {
  let providerUrl = FAUCET_RPC_PROVIDER
  let environmentConfig
  let hoprTokenContract

  if (environment) {
    const actualEnvironment = environment instanceof Array ? environment[0] : environment
    environmentConfig = getEnvironment(actualEnvironment)
    const network = environmentConfig.network_id

    if (!isValidNetwork(network)) {
      throw new Error('invalid environment')
    }

    const networkConfig = getNetwork(network)
    providerUrl = networkConfig.default_provider
  }

  const provider = new providers.StaticJsonRpcProvider(providerUrl)
  const wallet = new Wallet(FAUCET_SECRET_WALLET_PK as string, provider)

  if (environmentConfig) {
    const tokenAddressContract = environmentConfig.token_contract_address
    const abi = [
      'function transfer(address to, uint amount) returns (bool)',
      'function balanceOf(address) view returns (uint)'
    ]
    hoprTokenContract = new Contract(tokenAddressContract, abi, wallet)
  }

  return { wallet, hoprTokenContract }
}

export async function performTransaction(
  wallet: Signer,
  lockedTx: TransactionRequest,
  retries: number
): Promise<TransactionReceipt> {
  let start = Date.now()
  let end
  let timeElapsed
  try {
    console.log("Sending tx")
    const tx = await wallet.sendTransaction(lockedTx)
    end = Date.now()
    timeElapsed = end - start
    console.log(`Sent tx in ${timeElapsed}ms`)

    start = end
    const txConfirmed = await tx.wait()
    end = Date.now()
    timeElapsed = end - start
    console.log(`Confirmed tx on-chain in ${timeElapsed}ms`)

    return txConfirmed
  } catch (err: any) {
    end = Date.now()
    timeElapsed = end - start
    console.log(`Failed to execute tx after ${timeElapsed}ms`)
    if ((err.code == errors.REPLACEMENT_UNDERPRICED || err.code == errors.NETWORK_ERROR) && retries > 0) {
      // increase fees to improve chances of success on the retry
      let maxFeePerGas = lockedTx.maxFeePerGas
      if (maxFeePerGas) {
        maxFeePerGas = BigNumber.from(maxFeePerGas).mul(1.1)
      }
      let maxPriorityFeePerGas = lockedTx.maxPriorityFeePerGas
      if (maxPriorityFeePerGas) {
        maxPriorityFeePerGas = BigNumber.from(maxPriorityFeePerGas).mul(1.1)
      }
      const updatedTx = { maxFeePerGas, maxPriorityFeePerGas, ...lockedTx }
      console.log(`Retrying transaction because of ${err.code} error`)
      return performTransaction(wallet, updatedTx, retries - 1)
    }
    throw err
  }
}

export const getLockedTransaction = async (transaction: providers.TransactionRequest | undefined, wallet: Signer) => {
  if (!transaction) {
    throw new Error('no transaction given')
  }
  console.log("Acquiring locked tx")
  const start = Date.now()
  const client = new Redis(FAUCET_REDIS_URL as string)
  const address = await wallet.getAddress()
  const network = await wallet.provider?.getNetwork()
  const key = `${address}-${network?.name}`
  const storedNonce = await client.get(key)
  const chainNonce = await wallet.provider?.getTransactionCount(address, 'latest')
  let nonce
  if (chainNonce && storedNonce === null) {
    // initialize nonce once from the chain
    nonce = chainNonce
  } else {
    // ensure our stored nonce is up-to-date, if not overwrite it
    if (storedNonce === null) {
      nonce = 0
    } else {
      nonce = +storedNonce
    }
    if (chainNonce && nonce < chainNonce) {
      // this is only happening in cases were txs are performed outside of
      // this API
      nonce = chainNonce
    }
  }

  const noncedTransaction = { nonce, ...transaction }
  await client.set(key, nonce + 1)
  const end = Date.now()
  const timeElapsed = end - start
  console.log(`Acquired locked tx in ${timeElapsed}ms`)
  return noncedTransaction
}
