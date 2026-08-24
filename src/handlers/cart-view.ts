import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { cart, cartTotal, data, money } from "../shop.js";

// SCAFFOLD — generated from the bot blueprint BEFORE the agent runs.
// Keep a LIVE registration (.command / .callbackQuery / …) so this feature is
// never an empty stub. Replace the reply body with real logic + copy; if you
// change the user-facing text, update tests/specs to match EXACTLY.
// Do NOT rewrite src/bot.ts — buildBot() already auto-loads this module.
// Menu: wire this into /start via registerMainMenuItem({ label: "My Cart", data: "cart:view" }) if the toolkit exposes it.

registerMainMenuItem({ label: "My cart", data: "cart:view", order: 20 });
const composer = new Composer<Ctx>();
function cartView(ctx: Ctx): { text: string; markup: ReturnType<typeof inlineKeyboard> } {
  const shop = data(ctx); const lines = cart(ctx);
  if (!lines.length) return { text: "Your cart is empty. Browse the catalog to add products.", markup: inlineKeyboard([[inlineButton("Browse catalog", "catalog:start")], [inlineButton("Back to menu", "menu:main")]]) };
  const valid = lines.filter((line) => shop.products[line.productId]);
  const text = `Your cart\n${valid.map((line) => `${shop.products[line.productId].name} × ${line.quantity} — ${money(shop.products[line.productId].price * line.quantity)}`).join("\n")}\n\nTotal: ${money(cartTotal(shop, valid))}`;
  return { text, markup: inlineKeyboard([...valid.flatMap((line) => [[inlineButton(`Add one ${shop.products[line.productId].name}`, `cart:plus:${line.productId}`), inlineButton("Remove", `cart:remove:${line.productId}`)]]), [inlineButton("Checkout", "checkout:start")], [inlineButton("Browse catalog", "catalog:start")]]) };
}

composer.callbackQuery("cart:view", async (ctx) => {
  await ctx.answerCallbackQuery();
  const view = cartView(ctx); await ctx.reply(view.text, { reply_markup: view.markup });
});
composer.callbackQuery(/^cart:(plus|remove):(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery(); const action = ctx.match[1]; const id = ctx.match[2]; const shop = data(ctx); const lines = cart(ctx); const line = lines.find((item) => item.productId === id); const p = shop.products[id];
  if (!line || !p) { const view = cartView(ctx); await ctx.editMessageText(view.text, { reply_markup: view.markup }); return; }
  if (action === "plus") { if (line.quantity >= p.stock_qty) { await ctx.editMessageText("There isn't more stock available for this item."); return; } line.quantity += 1; } else { line.quantity -= 1; if (line.quantity <= 0) lines.splice(lines.indexOf(line), 1); }
  const view = cartView(ctx); await ctx.editMessageText(view.text, { reply_markup: view.markup });
});

export default composer;
