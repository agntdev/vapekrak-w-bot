import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";

// SCAFFOLD — generated from the bot blueprint BEFORE the agent runs.
// Keep a LIVE registration (.command / .callbackQuery / …) so this feature is
// never an empty stub. Replace the reply body with real logic + copy; if you
// change the user-facing text, update tests/specs to match EXACTLY.
// Do NOT rewrite src/bot.ts — buildBot() already auto-loads this module.
// Menu: wire this into /start via registerMainMenuItem({ label: "Info", data: "info:show" }) if the toolkit exposes it.

registerMainMenuItem({ label: "Info", data: "info:show", order: 40 });
const composer = new Composer<Ctx>();

composer.callbackQuery("info:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("VapeShop Kraków\nSelf-pickup in Kraków. Payment is cash on pickup.\n\nProducts are intended for adults. Please use nicotine products responsibly.", { reply_markup: inlineKeyboard([[inlineButton("Back to menu", "menu:main")]]) });
});

export default composer;
