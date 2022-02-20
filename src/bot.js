const Discord = require("discord.js");
const cron = require("node-cron");
const { fetchTokenPrice } = require("./price");
const bot = new Discord.Client();
require("dotenv").config();

bot.once("ready", async () => {
  console.log(`${process.env.NAME} bot is online`)
  updateStatus();
  cron.schedule("*/2 * * * * *", () => {
    updateStatus();
  });
});

const updateStatus = async () => {
  try {
    let price = (await fetchTokenPrice()).toFixed(process.env.PRICE_PRECISION);
    await bot.user.setActivity(`${process.env.NAME} $${price}`, {type: 'WATCHING'});
} catch (err) {
    console.log(`Error updating price status: ${err.message}`);
  }
};

const start = async () => {
  bot.login(process.env.DISCORD_TOKEN);
};

start();
