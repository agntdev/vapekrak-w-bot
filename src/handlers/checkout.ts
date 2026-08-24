import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { adminChatId, inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { cart, cartTotal, data, money, now, userKey } from "../shop.js";

const composer = new Composer<Ctx>();

function unavailable(ctx: Ctx): string | undefined {
  const shop = data(ctx);
  for (const line of cart(ctx)) { const p = shop.products[line.productId]; if (!p || !p.visible || p.stock_qty < line.quantity) return p ? `${p.name} no longer has enough stock.` : "An item in your cart is no longer available."; }
  return undefined;
}
composer.callbackQuery("checkout:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!cart(ctx).length) { await ctx.editMessageText("Your cart is empty. Add a product before checkout."); return; }
  const issue = unavailable(ctx); if (issue) { await ctx.editMessageText(`${issue} Update your cart before checkout.`); return; }
  await ctx.editMessageText("Are you 18 or older? This is an informational confirmation and won't prevent checkout.", { reply_markup: inlineKeyboard([[inlineButton("I am 18+", "checkout:age:yes")], [inlineButton("Continue anyway", "checkout:age:no")], [inlineButton("Back to cart", "cart:view")]]) });
});
composer.callbackQuery(/^checkout:age:(yes|no)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.flow = { kind: "checkout_phone", value: ctx.match[1] };
  await ctx.editMessageText("Enter a phone number for pickup updates, or send “skip”.");
});
composer.on("message:text", async (ctx, next) => {
  if (ctx.session.flow?.kind !== "checkout_phone") return next();
  const ageConfirmed = ctx.session.flow.value === "yes"; const phone = ctx.message.text.trim(); ctx.session.flow = undefined;
  const issue = unavailable(ctx); if (issue) { await ctx.reply(`${issue} Update your cart before checkout.`); return; }
  const shop = data(ctx); const lines = cart(ctx); const total = cartTotal(shop, lines);
  ctx.session.flow = { kind: "checkout_phone", value: `${ageConfirmed ? "yes" : "no"}|${phone === "skip" ? "" : phone}` };
  await ctx.reply(`Pickup: Kraków\nPayment: cash on pickup\nTotal: ${money(total)}\n\nConfirm your order.`, { reply_markup: inlineKeyboard([[inlineButton("Confirm order", "checkout:confirm")], [inlineButton("Back to cart", "cart:view")]]) });
});
composer.callbackQuery("checkout:confirm", async (ctx) => {
  await ctx.answerCallbackQuery();
  const pending = ctx.session.flow; if (pending?.kind !== "checkout_phone") { await ctx.editMessageText("Start checkout from your cart first."); return; }
  const issue = unavailable(ctx); if (issue) { await ctx.editMessageText(`${issue} Update your cart before checkout.`); return; }
  const [age, phone] = pending.value?.split("|") ?? ["no", ""]; const shop = data(ctx); const lines = cart(ctx).map((line) => ({ ...line }));
  for (const line of lines) shop.products[line.productId].stock_qty -= line.quantity;
  const id = `order-${shop.nextId++}`; const buyerId = Number(userKey(ctx));
  const order = { id, buyer: { id: buyerId, displayName: ctx.from?.first_name ?? "Customer", ...(phone ? { phone } : {}) }, items: lines, total: cartTotal(shop, lines), delivery_method: "pickup_krakow" as const, payment_method: "cash" as const, status: "new" as const, timestamp: now().toISOString(), ageConfirmed: age === "yes" };
  shop.orders[id] = order; shop.orderIds.push(id); shop.carts[userKey(ctx)] = []; ctx.session.flow = undefined;
  const ref = shop.referrals[userKey(ctx)];
  if (ref && !ref.rewarded) { ref.rewarded = true; const referrer = (shop.referrals[String(ref.referrer_id)] ??= { referrer_id: ref.referrer_id, referee_id: ref.referrer_id, reward_balance: 0, rewarded: false }); referrer.reward_balance += shop.referralRules.firstOrderCredit; try { await ctx.api.sendMessage(ref.referrer_id, `Your referral made a first order. ${shop.referralRules.firstOrderCredit.toFixed(2)} zł store credit was added.`); } catch { /* A blocked or unopened chat must not block checkout. */ } }
  const admin = adminChatId(ctx as { env?: Record<string, unknown> }); if (admin) { try { await ctx.api.sendMessage(admin, `New order ${id}\n${order.buyer.displayName}\n${money(order.total)}\nCash on pickup in Kraków.`); } catch { /* Notification delivery is best effort. */ } }
  await ctx.editMessageText(`Your order is confirmed. Total: ${money(order.total)}. We'll prepare it for self-pickup in Kraków; payment is cash on pickup.`, { reply_markup: inlineKeyboard([[inlineButton("Back to menu", "menu:main")]]) });
});
export default composer;
