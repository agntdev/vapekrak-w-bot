import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { data, userKey } from "../shop.js";

// SCAFFOLD — generated from the bot blueprint BEFORE the agent runs.
// Keep a LIVE registration (.command / .callbackQuery / …) so this feature is
// never an empty stub. Replace the reply body with real logic + copy; if you
// change the user-facing text, update tests/specs to match EXACTLY.
// Do NOT rewrite src/bot.ts — buildBot() already auto-loads this module.
// Menu: wire this into /start via registerMainMenuItem({ label: "Refer a Friend", data: "referral:invite" }) if the toolkit exposes it.

registerMainMenuItem({ label: "Refer a friend", data: "referral:invite", order: 30 });
const composer = new Composer<Ctx>();

composer.callbackQuery("referral:invite", async (ctx) => {
  await ctx.answerCallbackQuery();
  const id = userKey(ctx); const shop = data(ctx); if (!shop.referrals[id]) shop.referrals[id] = { referrer_id: Number(id), referee_id: Number(id), reward_balance: 0, rewarded: false }; const botName = ctx.me.username;
  const link = botName ? `https://t.me/${botName}?start=ref-${id}` : `Open this bot with /start ref-${id}`;
  const referral = shop.referrals[id];
  const balance = referral?.reward_balance ?? 0;
  await ctx.reply(`Share your referral link:\n${link}\n\nStore credit: ${balance.toFixed(2)} zł`, { reply_markup: inlineKeyboard([[inlineButton("Back to menu", "menu:main")]]) });
});

export default composer;
