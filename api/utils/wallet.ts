import { providers, errors, BigNumber } from "ethers";
import Redis from "ioredis";

import type { Signer } from "@ethersproject/abstract-signer";
import type {
  TransactionRequest,
  TransactionReceipt,
} from "@ethersproject/abstract-provider";

import {
  isValidEnvironment,
  protocolConfig,
  isValidNetwork,
} from "./protocol";

const {FAUCET_REDIS_URL, FAUCET_RPC_PROVIDER, FAUCET_SECRET_WALLET_PK} = process.env;

export function getWallet(environment?: string | string[]): {
  let providerUrl = FAUCET_RPC_PROVIDER;
  let environmentConfig;
  let hoprTokenContract;

  if (environment) {
    const actualEnvironment =
      environment instanceof Array ? environment[0] : environment;
    environmentConfig = protocolConfig.environments[actualEnvironment];
    const network = environmentConfig.network_id;

    if (!isValidNetwork(network)) {
      throw new Error("invalid environment");
    }

    const networkConfig = protocolConfig.networks[network];
    providerUrl = networkConfig.default_provider;
  }

  const provider = new providers.StaticJsonRpcProvider(providerUrl);
  const wallet = new Wallet(FAUCET_SECRET_WALLET_PK, provider);

  if (environmentConfig) {
    const tokenAddressContract = environmentConfig.token_contract_address;
    const abi = ["function transfer(address to, uint amount) returns (bool)"];
    hoprTokenContract = new Contract(tokenAddressContract, abi, wallet);
  }

  return { wallet, hoprTokenContract, provider };
}

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
  transaction: providers.TransactionRequest,
  wallet: string,
  network: string,
  provider: providers.StaticJsonRpcProvider
) => {
  const client = new Redis(FAUCET_REDIS_URL);
  const address = await wallet.getAddress();
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
