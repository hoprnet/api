import protocolConfig from "../protocol-config.json";

export type Environment = keyof typeof protocolConfig.environments;
export type Networks = "hardhat" | "xdai" | "goerli";

export const isValidEnvironment = (
  environment: string
): environment is Environment => {
  return environment in protocolConfig.environments;
};

export const isValidNetwork = (network: string): network is Networks => {
  return network in protocolConfig.networks;
};

export { protocolConfig };
