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
  let nonce;
  if (storedNonce === null) {
    nonce = await provider.getTransactionCount(address, "latest");
  } else {
    nonce = +storedNonce;
  }

  const noncedTransaction = { nonce, ...transaction };
  await client.set(key, nonce + 1);
  return noncedTransaction;
};
