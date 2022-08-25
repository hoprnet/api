import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const { FAUCET_REDIS_URL, FAUCET_SECRET_API_KEY, FAUCET_SECRET_WALLET_PK, FAUCET_RPC_PROVIDER } = process.env

export function middleware(req: NextRequest) {
  if (!FAUCET_REDIS_URL) {
    return NextResponse.rewrite(new URL('/api/error/db-not-configured', req.url))
  }

  if (!FAUCET_SECRET_API_KEY) {
    return NextResponse.rewrite(new URL('/api/error/api-key-not-configured', req.url))
  }

  if (req.headers.get('x-api-key') != FAUCET_SECRET_API_KEY) {
    return NextResponse.rewrite(new URL('/api/error/incorrect-api-key', req.url))
  }

  if (!FAUCET_SECRET_WALLET_PK) {
    return NextResponse.rewrite(new URL('/api/error/wallet-not-configured', req.url))
  }

  if (!FAUCET_RPC_PROVIDER) {
    return NextResponse.rewrite(new URL('/api/error/rpc-provider-not-configured', req.url))
  }

  return NextResponse.next()
}
