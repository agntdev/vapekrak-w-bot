# VapeShop Kraków — Bot specification

**Archetype:** commerce

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

Telegram commerce bot for legal e-liquids, cartridges, and disposable vape devices in Kraków. Features public catalog browsing, guest checkout with cash on pickup, referral bonuses, and admin controls for managing products and orders.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- Adults in Kraków seeking to purchase e-liquids and vape hardware
- Non-registered buyers looking for guest checkout

## Success criteria

- User completes purchase with cash on pickup
- Admin receives order notifications and can manage catalog
- Referral system tracks and rewards users

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open the main menu
- **Browse Catalog** (button, actor: user, callback: catalog:start) — View product categories and items
- **My Cart** (button, actor: user, callback: cart:view) — View and manage cart items
- **Refer a Friend** (button, actor: user, callback: referral:invite) — Generate personal referral link
- **Info** (button, actor: user, callback: info:show) — View store information

## Flows

### Catalog Browsing
_Trigger:_ catalog:start

1. Display categories
2. Select category to view products
3. View product details
4. Add to cart or return

_Data touched:_ Product, Category

### Cart & Checkout
_Trigger:_ cart:view

1. Display cart items
2. Edit quantities or remove items
3. Proceed to checkout
4. Confirm age (18+)
5. Enter pickup details
6. Confirm order

_Data touched:_ Order, Product

### Referral Program
_Trigger:_ referral:invite

1. Display personal referral link
2. Track new users via link
3. Award referral bonus on first order

_Data touched:_ Referral

### Admin Panel
_Trigger:_ /admin

1. Authenticate admin
2. Manage categories and products
3. Edit stock and visibility
4. View orders and users
5. Adjust referral rules

_Data touched:_ Product, Category, Order, Referral

## Owner-supplied settings

The OWNER provides these; they are collected in chat and injected into the environment at deploy. Read each one from the environment where it is used (`ctx.env.<KEY>` / `env.<KEY>` on Cloudflare Workers; `process.env.<KEY>` only as a Node/harness fallback — never the sole read). Do NOT invent your own way of learning the value, do NOT ask for it in a bot message, and do NOT hardcode a default.

- **ADMIN_CHAT_ID** — Telegram chat ID for admin notifications
  - this is the OWNER's own chat id; the platform already knows it. Read `ADMIN_CHAT_ID` via `ctx.env` (prefer toolkit `adminChatId` / `requireOwner`) — never ask a user, never treat whoever writes first as the admin, never invent claim-admin or open manage for everyone.
  - may be UNSET at runtime: the bot must still start, and the feature needing ADMIN_CHAT_ID must say so plainly instead of failing.

Your behavioral specs run WITHOUT these values, so no spec may depend on one.

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

An entity that merely NAMES an owner-supplied setting above (an admin chat, an API account) is not something to store or discover — read it from the environment.

- **Product** _(retention: persistent)_ — Catalog item with pricing and availability
  - fields: name, SKU, price, category, stock_qty, excise_flag, images, description, visible
- **Category** _(retention: persistent)_ — Product grouping for catalog navigation
  - fields: title, description, order
- **Order** _(retention: persistent)_ — User purchase with delivery/payment details
  - fields: buyer, items, total, delivery_method, payment_method, status, timestamp
- **Referral** _(retention: persistent)_ — User referral tracking and rewards
  - fields: referrer_id, referee_id, reward_balance, reward_rules
- **Admin** _(retention: persistent)_ — Administrative configuration and access
  - fields: admin_chat_ids

## Integrations

- **Telegram** (required) — Bot API messaging
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Manage product catalog and categories
- Adjust stock levels and product visibility
- Configure referral reward rules
- View and update order statuses
- Receive admin notifications in configured chat

## Notifications

- New order notifications to admin chat
- Referral bonus notifications to users
- Admin action confirmations

## Permissions & privacy

- User data (Telegram ID, display name, phone) stored for order tracking and referrals
- Age confirmation is informational only and not enforced
- No personal data collected beyond what's necessary for order fulfillment

## Edge cases

- Out-of-stock items in cart during checkout
- Multiple admins managing catalog simultaneously
- Referral link used by non-new users
- User attempts to checkout without age confirmation

## Required tests

- End-to-end purchase flow from catalog to cash on pickup
- Admin can add/edit/remove products and categories
- Referral system tracks and rewards correctly
- Age confirmation is shown and recorded but does not block purchase

## Assumptions

- Admin notifications go to a single chat ID
- Referral rewards default to store credit
- Guest checkout requires only optional phone and display name
- Default categories are pre-seeded by admin
- Age check is a single informational question
- Delivery is limited to self-pickup in Kraków
