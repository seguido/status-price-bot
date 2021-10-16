const ethers = require("ethers");
const oracleAbi = require('../oracleAbi.json');

const fetchTokenPrice = async () => {
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC);
  const oracleContract = new ethers.Contract(process.env.ORACLE_ADDRESS, oracleAbi, provider);

  let price = await oracleContract.calculateAssetPrice(process.env.TOKEN_ADDRESS);
  return price / (10**process.env.TOKEN_DECIMALS);
};

module.exports = {
    fetchTokenPrice
}
