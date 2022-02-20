const ethers = require("ethers");
const beetsPoolsContractAbi = require('./contractAbi.json');

const fetchTokenPrice = async () => {
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC);
  const contract = new ethers.Contract(process.env.BEETS_POOLS, beetsPoolsContractAbi, provider);

  let price = await contract.getPoolTokens("0x8c3c964c2d08679d3d09866cf62c5b14a5346479000100000000000000000207");
  let impAmount = price.balances[0]/1e9;
  let daiAmount = price.balances[3]/1e18;
  let impPrice = (daiAmount*7)/impAmount
  return impPrice;
};

module.exports = {
    fetchTokenPrice
}
