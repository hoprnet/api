import { providers } from "ethers";
import Redis from "ioredis";

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
  const currentTransactions = await provider.getTransactionCount(
    address,
    "latest"
  );
  // if nonce is outdated or unset we use the nr of txs as the base
  let nonce = currentTransactions;
  if (!!+storedNonce && nonce < storedNonce) {
    nonce = storedNonce;
  }
  const noncedTransaction = { nonce, ...transaction };
  await client.set(key, nonce + 1);
  return noncedTransaction;
};
