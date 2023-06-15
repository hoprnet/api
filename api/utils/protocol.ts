// @ts-ignore
import protocolConfig from '../protocol-config.json' assert { type: 'json' }

export type Network = keyof typeof protocolConfig.networks
export type Chains = keyof typeof protocolConfig.chains
export type ChainKeys = 'anvil' | 'xdai' | 'goerli'

export const isValidNetwork = (network: string): network is Network => {
  return network in protocolConfig.networks
}

export const isValidChain = (chain: string): chain is ChainKeys => {
  return chain in protocolConfig.chains
}

export const getNetwork = (network: string) => {
  return protocolConfig.networks[network as Network]
}

export const getChain = (chain: string) => {
  return protocolConfig.chains[chain as Chains]
}
