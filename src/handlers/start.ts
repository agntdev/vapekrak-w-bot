import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { mainMenuKeyboard } from "../toolkit/index.js";
import { data, userKey } from "../shop.js";

// The /start handler renders the bot's MAIN MENU — the primary way users operate
// a button-first bot. A feature adds its own button by calling
// `registerMainMenuItem(...)` in its own `src/handlers/<slug>.ts`; this handler
// renders whatever is registered (plus a Help button), so you do NOT edit this
// file to add a feature. Send ONE message — no placeholder line above the menu.
const composer = new Composer<Ctx>();

const WELCOME = "VapeShop Kraków\nChoose a section below.";

composer.command("start", async (ctx) => {
  const code = ctx.match?.trim();
  if (code?.startsWith("ref-")) {
    const referrer = Number(code.slice(4));
    if (Number.isSafeInteger(referrer) && referrer > 0 && referrer !== ctx.from?.id) {
      const shop = data(ctx);
      const key = userKey(ctx);
      if (!shop.referrals[key]) shop.referrals[key] = { referrer_id: referrer, referee_id: Number(key), reward_balance: 0, rewarded: false };
    }
  }
  await ctx.reply(WELCOME, { reply_markup: mainMenuKeyboard() });
});

// "Back to menu" — re-render the main menu in place from any sub-view.
composer.callbackQuery("menu:main", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(WELCOME, { reply_markup: mainMenuKeyboard() });
});

export default composer;
