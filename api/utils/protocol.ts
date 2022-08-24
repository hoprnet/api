// @ts-ignore
import protocolConfig from "../protocol-config.json" assert { type: "json" };

export type Environment = keyof typeof protocolConfig.environments;
export type Network = keyof typeof protocolConfig.networks;
export type Networks = "hardhat" | "xdai" | "goerli";

export const isValidEnvironment = (
  environment: string
): environment is Environment => {
  return environment in protocolConfig.environments;
};

export const isValidNetwork = (network: string): network is Networks => {
  return network in protocolConfig.networks;
};

export const getEnvironment = (environment: string) => {
  return protocolConfig.environments[environment as Environment];
};

export const getNetwork = (network: string) => {
  return protocolConfig.networks[network as Network];
};
