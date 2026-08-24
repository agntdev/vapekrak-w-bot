import type { Ctx } from "./bot.js";

export type Category = { id: string; title: string; description: string; order: number };
export type Product = { id: string; name: string; sku: string; price: number; category: string; stock_qty: number; excise_flag: boolean; images: string[]; description: string; visible: boolean };
export type CartLine = { productId: string; quantity: number };
export type Order = { id: string; buyer: { id: number; displayName: string; phone?: string }; items: CartLine[]; total: number; delivery_method: "pickup_krakow"; payment_method: "cash"; status: "new" | "preparing" | "ready" | "completed" | "cancelled"; timestamp: string; ageConfirmed: boolean };
export type Referral = { referrer_id: number; referee_id: number; reward_balance: number; rewarded: boolean };
export type ShopData = { categories: Record<string, Category>; categoryIds: string[]; products: Record<string, Product>; productIds: string[]; carts: Record<string, CartLine[]>; orders: Record<string, Order>; orderIds: string[]; referrals: Record<string, Referral>; referralRules: { firstOrderCredit: number }; nextId: number };
export type Flow = { kind: "checkout_phone" | "admin_category" | "admin_category_edit" | "admin_product" | "admin_product_edit" | "admin_stock" | "admin_reward"; value?: string };

/** The single clock seam for order timestamps. Tests may replace it if needed. */
export let now = (): Date => new Date();
export function setNowForTests(clock: () => Date): void { now = clock; }

export function data(ctx: Ctx): ShopData {
  if (!ctx.shop) ctx.shop = { categories: {}, categoryIds: [], products: {}, productIds: [], carts: {}, orders: {}, orderIds: [], referrals: {}, referralRules: { firstOrderCredit: 10 }, nextId: 1 };
  return ctx.shop;
}
export function userKey(ctx: Ctx): string { return String(ctx.from?.id ?? ctx.chat?.id ?? 0); }
export function nextId(shop: ShopData, prefix: string): string { const id = `${prefix}${shop.nextId}`; shop.nextId += 1; return id; }
export function money(cents: number): string { return `${(cents / 100).toFixed(2)} zł`; }
export function cart(ctx: Ctx): CartLine[] { const shop = data(ctx); const key = userKey(ctx); return (shop.carts[key] ??= []); }
export function product(shop: ShopData, id: string): Product | undefined { return shop.products[id]; }
export function cartTotal(shop: ShopData, lines: CartLine[]): number { return lines.reduce((sum, line) => sum + (shop.products[line.productId]?.price ?? 0) * line.quantity, 0); }
export function visibleProducts(shop: ShopData, categoryId: string): Product[] { return shop.productIds.map((id) => shop.products[id]).filter((p): p is Product => Boolean(p && p.visible && p.category === categoryId)); }
export function escape(value: string): string { return value.replace(/[<>]/g, ""); }
