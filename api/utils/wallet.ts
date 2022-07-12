import { providers, errors, BigNumber } from "ethers";
import Redis from "ioredis";

import type { Signer } from "@ethersproject/abstract-signer";
import type {
  TransactionRequest,
  TransactionReceipt,
} from "@ethersproject/abstract-provider";

export async function performTransaction(
  wallet: Signer,
  lockedTx: TransactionRequest,
  retries: number
): Promise<TransactionReceipt> {
  try {
    const tx = await wallet.sendTransaction(lockedTx);
    const txConfirmed = await tx.wait();
    return txConfirmed;
  } catch (err: any) {
    if (
      (err.code == errors.REPLACEMENT_UNDERPRICED ||
        err.code == errors.NETWORK_ERROR) &&
      retries > 0
    ) {
      // increase fees to improve chances of success on the retry
      let maxFeePerGas = lockedTx.maxFeePerGas;
      if (maxFeePerGas) {
        maxFeePerGas = BigNumber.from(maxFeePerGas).mul(1.1);
      }
      let maxPriorityFeePerGas = lockedTx.maxPriorityFeePerGas;
      if (maxPriorityFeePerGas) {
        maxPriorityFeePerGas = BigNumber.from(maxPriorityFeePerGas).mul(1.1);
      }
      const updatedTx = { maxFeePerGas, maxPriorityFeePerGas, ...lockedTx };
      console.log(`Retrying transaction because of ${err.code} error`);
      return performTransaction(wallet, updatedTx, retries - 1);
    }
    throw err;
  }
}

export const getLockedTransaction = async (
  redisUrl: string,
  transaction: providers.TransactionRequest,
  address: string,
  network: string,
  provider: providers.JsonRpcProvider
) => {
  const client = new Redis(redisUrl);
  const key = `${address}-${network}`;
  const storedNonce = await client.get(key);
  const chainNonce = await provider.getTransactionCount(address, "latest");
  let nonce;
  if (storedNonce === null) {
    // initialize nonce once from the chain
    nonce = chainNonce;
  } else {
    // ensure our stored nonce is up-to-date, if not overwrite it
    nonce = +storedNonce;
    if (nonce < chainNonce) {
      // this is only happening in cases were txs are performed outside of
      // this API
      nonce = chainNonce;
    }
  }

  const noncedTransaction = { nonce, ...transaction };
  await client.set(key, nonce + 1);
  return noncedTransaction;
};
