const ethers = require("ethers");
const beetsPoolsContractAbi = require('./contractAbi.json');

const fetchTokenPrice = async () => {
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC);
  const contract = new ethers.Contract(process.env.BEETS_POOLS, beetsPoolsContractAbi, provider);

  let price = await contract.getPoolTokens(process.env.SUMMIT_BEETS_POOL);
  let usdcAmount = price.balances[0]/1e6;
  let summitV2Amount = price.balances[1]/1e18;
  let summitv2Price = (usdcAmount*3)/summitV2Amount
  return summitv2Price;
};

module.exports = {
    fetchTokenPrice
}
