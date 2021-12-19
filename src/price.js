const BigNumber = require("bignumber.js");
const ethers = require("ethers");
const oracleAbi = require("../oracleAbi.json");
const multicallAbi = require("../multicallAbi.json");

const fetchTokenPrice = async () => {
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC);
  const oracleContract = new ethers.Contract(
    process.env.ORACLE_ADDRESS,
    oracleAbi,
    provider
  );

  let price = await oracleContract.calculateAssetPrice(
    process.env.TOKEN_ADDRESS
  );
  return price / 10 ** process.env.TOKEN_DECIMALS;
};

const lp = {
  name: "spirit-scr-mim",
  address: "0x468c174cc015d4a697586C0a99F95E045F7e6f91",
  chainId: 250,
  lp0: {
    address: "0x8183C18887aC4386CE09Dbdf5dF7c398DAcB2B5a",
    oracleId: "SCR",
    decimals: "1e9",
  },
  lp1: {
    address: "0x82f0B8B456c1A451378467398982d4834b6829c1",
    oracleId: "MIM",
    decimals: "1e18",
  },
};

const calcTokenPrice = (knownPrice, knownToken, unknownToken) => {
  const valuation = knownToken.balance
    .dividedBy(knownToken.decimals)
    .multipliedBy(knownPrice);
  const price = valuation
    .multipliedBy(unknownToken.decimals)
    .dividedBy(unknownToken.balance);
  const weight = knownToken.balance.plus(unknownToken.balance).toNumber();

  return {
    price: price.toNumber(),
    weight: unknownToken.balance.dividedBy(unknownToken.decimals).toNumber(),
  };
};

const calcLpPrice = (pool, tokenPrices) => {
  const lp0 = pool.lp0.balance
    .multipliedBy(tokenPrices[pool.lp0.oracleId])
    .dividedBy(pool.lp0.decimals);
  const lp1 = pool.lp1.balance
    .multipliedBy(tokenPrices[pool.lp1.oracleId])
    .dividedBy(pool.lp1.decimals);
  return lp0
    .plus(lp1)
    .multipliedBy(pool.decimals)
    .dividedBy(pool.totalSupply)
    .toNumber();
};

const fetchTokenPriceLp = async () => {
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC);
  const multicall = new ethers.Contract(
    process.env.MULTICALL,
    multicallAbi,
    provider
  );

  const BATCH_SIZE = 10;

  const liquidityPools = [lp];
  const filtered = liquidityPools;
  const query = liquidityPools.map((p) => [p.address, p.lp0.address, p.lp1.address]);

  for (let i = 0; i < filtered.length; i += BATCH_SIZE) {
    const batch = query.slice(i, i + BATCH_SIZE);
    const buf = await multicall.getLpInfo(batch);

    for (let j = 0; j < batch.length; j++) {
      filtered[j + i].totalSupply = new BigNumber(buf[j * 3 + 0].toString());
      filtered[j + i].lp0.balance = new BigNumber(buf[j * 3 + 1].toString());
      filtered[j + i].lp1.balance = new BigNumber(buf[j * 3 + 2].toString());
    }
  }

  const knownPrices = { MIM: 1.0 };
  let prices = { ...knownPrices };
  let lps = {};
  let weights = {};

  const unsolved = filtered.slice();
  let solving = true;
  while (solving) {
    solving = false;

    for (let i = unsolved.length - 1; i >= 0; i--) {
      const pool = unsolved[i];

      let knownToken, unknownToken;
      if (pool.lp0.oracleId in prices) {
        knownToken = pool.lp0;
        unknownToken = pool.lp1;
      } else if (pool.lp1.oracleId in prices) {
        knownToken = pool.lp1;
        unknownToken = pool.lp0;
      } else {
        continue;
      }

      const { price, weight } = calcTokenPrice(
        prices[knownToken.oracleId],
        knownToken,
        unknownToken
      );

      if (weight > (weights[unknownToken.oracleId] || 0)) {
        prices[unknownToken.oracleId] = price;

        weights[unknownToken.oracleId] = weight;
      }
      lps[pool.name] = calcLpPrice(pool, prices);

      unsolved.splice(i, 1);
      solving = true;
    }
  }
  return prices["SCR"];
};

module.exports = {
  fetchTokenPrice,
  fetchTokenPriceLp,
};
