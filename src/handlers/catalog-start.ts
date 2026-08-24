import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { cart, data, money, product, visibleProducts } from "../shop.js";

// SCAFFOLD — generated from the bot blueprint BEFORE the agent runs.
// Keep a LIVE registration (.command / .callbackQuery / …) so this feature is
// never an empty stub. Replace the reply body with real logic + copy; if you
// change the user-facing text, update tests/specs to match EXACTLY.
// Do NOT rewrite src/bot.ts — buildBot() already auto-loads this module.
// Menu: wire this into /start via registerMainMenuItem({ label: "Browse Catalog", data: "catalog:start" }) if the toolkit exposes it.

registerMainMenuItem({ label: "Browse catalog", data: "catalog:start", order: 10 });
const composer = new Composer<Ctx>();

function categoryKeyboard(ctx: Ctx) {
  const shop = data(ctx);
  const categories = shop.categoryIds.map((id) => shop.categories[id]).filter(Boolean).sort((a, b) => a.order - b.order);
  return inlineKeyboard([...categories.map((c) => [inlineButton(c.title, `catalog:category:${c.id}`)]), [inlineButton("Back to menu", "menu:main")]]);
}

composer.callbackQuery("catalog:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  const shop = data(ctx);
  if (shop.categoryIds.length === 0) { await ctx.reply("The catalog is being prepared. Please check back soon.", { reply_markup: inlineKeyboard([[inlineButton("Back to menu", "menu:main")]]) }); return; }
  await ctx.reply("Choose a category.", { reply_markup: categoryKeyboard(ctx) });
});

composer.callbackQuery(/^catalog:category:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const category = data(ctx).categories[ctx.match[1]];
  if (!category) { await ctx.editMessageText("That category is no longer available.", { reply_markup: categoryKeyboard(ctx) }); return; }
  const products = visibleProducts(data(ctx), category.id);
  if (!products.length) { await ctx.editMessageText(`${category.title} has no available products right now.`, { reply_markup: inlineKeyboard([[inlineButton("All categories", "catalog:start")]]) }); return; }
  await ctx.editMessageText(`${category.title}\n${category.description}`, { reply_markup: inlineKeyboard([...products.map((p) => [inlineButton(`${p.name} — ${money(p.price)}`, `catalog:product:${p.id}`)]), [inlineButton("All categories", "catalog:start")]]) });
});
composer.callbackQuery(/^catalog:product:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const p = product(data(ctx), ctx.match[1]);
  if (!p || !p.visible) { await ctx.editMessageText("That product is no longer available.", { reply_markup: inlineKeyboard([[inlineButton("Browse catalog", "catalog:start")]]) }); return; }
  await ctx.editMessageText(`${p.name}\n${p.description}\n${money(p.price)}\nIn stock: ${p.stock_qty}`, { reply_markup: inlineKeyboard([[inlineButton("Add to cart", `cart:add:${p.id}`)], [inlineButton("Back to catalog", `catalog:category:${p.category}`)]] ) });
});
composer.callbackQuery(/^cart:add:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const shop = data(ctx); const p = product(shop, ctx.match[1]);
  if (!p || !p.visible || p.stock_qty < 1) { await ctx.editMessageText("This product is out of stock.", { reply_markup: inlineKeyboard([[inlineButton("Browse catalog", "catalog:start")]]) }); return; }
  const lines = cart(ctx); const line = lines.find((item) => item.productId === p.id);
  if (line) { if (line.quantity >= p.stock_qty) { await ctx.editMessageText("You already have the available quantity in your cart."); return; } line.quantity += 1; } else lines.push({ productId: p.id, quantity: 1 });
  await ctx.editMessageText(`${p.name} was added to your cart.`, { reply_markup: inlineKeyboard([[inlineButton("View cart", "cart:view")], [inlineButton("Keep browsing", `catalog:category:${p.category}`)]]) });
});

export default composer;
