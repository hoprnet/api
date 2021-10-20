import { Ed25519Provider } from "key-did-provider-ed25519";
import KeyResolver from "key-did-resolver";
import { DID } from "dids";
import CeramicClient from "@ceramicnetwork/http-client";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import isIp from 'is-ip'
import { providers, Wallet, utils } from 'ethers';
import type { NextApiRequest, NextApiResponse } from 'next'

type CeramicStream = {
  id: string,
  content: Commit
}

type CeramicStreamResponse = {
  stream?: CeramicStream
  err?: string
}

type Commit = {
  ip: string
}

const secretKey = Uint8Array.from(
  utils.arrayify(`${process.env.FAUCET_SECRET_WALLET_PK}`)
);
const provider = new Ed25519Provider(secretKey);
const did = new DID({ provider, resolver: KeyResolver.getResolver() });
const client = new CeramicClient('https://ceramic-one.hoprnet.io/');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CeramicStreamResponse>
) {
  const { method, query: { commit }, body: { secret, ip } } = req;

  if (secret != process.env.FAUCET_SECRET_API_KEY) return res.status(401).json({ err: 'No secret passed' })
  if (method != 'POST') return res.status(405).json({ err: 'Only POST method allowed' })

  try {

    if (commit.length != 7 || commit instanceof Array) return res.status(422).json({ err: 'Invalid non-seven characters git commit hash' })
    if (!isIp(ip)) return res.status(422).json({ err: 'Shared IP is not a valid IPv4 or IPv6 IP' })
    if (!process.env.FAUCET_RPC_PROVIDER) return res.status(501).json({ err: 'No provider defined in server' })
    if (!process.env.FAUCET_SECRET_WALLET_PK) return res.status(501).json({ err: 'No faucet private key defined in server' })

    const provider = new providers.JsonRpcProvider(process.env.FAUCET_RPC_PROVIDER);
    const wallet = new Wallet(process.env.FAUCET_SECRET_WALLET_PK, provider);
    const address = await wallet.getAddress();

    await did.authenticate();
    client.setDID(did);

    const tile = await TileDocument.create<Commit>(client, null, {
      deterministic: true,
      tags: [commit],
      family: address,
    });
    const content = Object.assign({}, { "ip": ip })
    tile.update(content);
    //NB: We return the to-be-anchored content w/o waiting for it.
    res.status(200).json({ stream: { id: tile.id.toString(), content } })

  } catch (err: any) {
    console.error(err);
    if (err) return res.status(501).json({ err: 'There was an error during the storage of the commit' })
  }
}
