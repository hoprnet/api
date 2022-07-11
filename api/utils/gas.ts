import ethers from "ethers";

function gasToNumber(gas: string) {
  const parsedGas = gas.split(" ");

  // as in https://github.com/wighawag/hardhat-deploy/blob/819df0fad56d75a5de5218c3307bec2093f8794c/src/DeploymentsManager.ts#L974
  let gasInteger: string;
  if (parsedGas.length > 1) {
    gasInteger = ethers.utils.parseUnits(parsedGas[0], parsedGas[1]).toString();
  } else {
    gasInteger = parsedGasPrice[0];
  }

  return gasInteger;
}

export function getGasParams({
  hardhat_deploy_gas_price: string,
  max_fee_per_gas: string,
  max_priority_fee_per_gas: string,
}) {
  const params = {};

  if (hardhat_deploy_gas_price) {
    params.gasPrice = gasToNumber(hardhat_deploy_gas_price);
  }

  if (max_fee_per_gas) {
    params.maxFeePerGas = gasToNumber(max_fee_per_gas);
  }

  if (max_priority_fee_per_gas) {
    params.maxPriorityFeePerGas = gasToNumber(max_priority_fee_per_gas);
  }

  return params;
}
