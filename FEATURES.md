# FEATURES.md — คู่มือ AI สำหรับระบบ Zend YouTube Premium

> อัปเดตล่าสุด: 2026-03-26
> ใช้ไฟล์นี้เป็น context เมื่อ AI เข้ามาทำงานใน session ใหม่

---

## ภาพรวมระบบ

ระบบซื้อขายรหัส YouTube Premium แบบ Subscription ใช้ Next.js 16 + Drizzle ORM + Turso (LibSQL) + Tailwind CSS + shadcn/ui

**Stack:**
- Framework: Next.js 16.1.6 (App Router, Server Actions)
- DB: Turso/LibSQL SQLite via Drizzle ORM
- Auth: Custom session (LINE LIFF + Email/Password)
- Payment: Stripe + Manual Bank Transfer
- Storage: AWS S3/R2 (file uploads)
- Email: Resend API (fetch-based, no npm package needed)

---

## โครงสร้างหลัก

```
src/
├── app/                    # Next.js pages & routes
│   ├── dashboard/          # Admin backoffice
│   ├── account/            # Customer account area
│   ├── cart/               # Shopping cart
│   ├── rent/               # Product listing + Checkout
│   ├── api/                # API routes (checkout, cron, etc.)
│   └── ...
├── features/               # Business logic (repo + actions)
│   ├── order/              # Order management
│   ├── cart/               # Cart management
│   ├── coupon/             # Coupon/Promo codes ✨ NEW
│   ├── wallet/             # Customer wallet ✨ NEW
│   ├── waitlist/           # Product waitlist ✨ NEW
│   ├── notification/       # Notification service ✨ NEW
│   ├── inventory/          # Customer inventory (auto-renewal) ✨ UPDATED
│   ├── membership/         # Membership plans
│   ├── promotion/          # Promotions
│   └── ...
├── db/
│   └── schema/             # Drizzle table definitions
└── components/             # Shared UI components
```

---

## ตารางฐานข้อมูล (ทั้งหมด)

| ตาราง | คำอธิบาย |
|-------|---------|
| customers | ลูกค้า (LINE LIFF + Email) |
| orders | คำสั่งซื้อ |
| order_items | รายการในคำสั่งซื้อ |
| order_item_modifiers | ตัวเลือกเสริม per item |
| products | สินค้า/แพ็กเกจ |
| categories | หมวดหมู่สินค้า |
| modifier_groups | กลุ่มตัวเลือก |
| modifiers | ตัวเลือกเสริม |
| promotions | โปรโมชันลดราคา (%) ตามช่วงเวลา |
| promotion_products | สินค้าที่ร่วมโปร |
| **coupons** | Coupon/รหัสส่วนลด ✨ NEW |
| **coupon_usages** | บันทึกการใช้ coupon ✨ NEW |
| **customer_wallets** | กระเป๋าเงิน 1:1 กับ customer ✨ NEW |
| **wallet_transactions** | ประวัติธุรกรรม wallet ✨ NEW |
| **product_waitlist** | รายชื่อลูกค้ารอสินค้า ✨ NEW |
| **notification_logs** | บันทึกการส่ง notification ✨ NEW |
| customer_inventories | Credentials ที่ส่งมอบให้ลูกค้า (มีคอลัมน์ `auto_renew` ✨ NEW) |
| customer_memberships | การสมัครสมาชิก |
| membership_plans | แผนสมาชิก |
| account_stock | Individual YouTube accounts |
| family_groups | กลุ่ม Family Plan |
| family_members | สมาชิกในกลุ่ม Family |
| invite_links | Invite links |
| customer_cart_items | ตะกร้าสินค้า (per customer) |
| customer_addresses | ที่อยู่จัดส่ง |
| admin_users | Admin users |
| roles | บทบาท Admin |
| page_permissions | สิทธิ์เข้าถึงแต่ละหน้า |
| audit_logs | Audit trail ทุก action |
| settings | ตั้งค่าร้าน (key-value) |
| payments | ข้อมูลการชำระเงิน |

**คอลัมน์ใหม่ใน `orders`:**
- `coupon_id` — FK → coupons
- `coupon_code` — รหัส coupon ที่ใช้ (cached text)
- `coupon_discount` — มูลค่าส่วนลด (บาท)
- `wallet_credit_used` — ยอดที่ชำระด้วย wallet (บาท)

---

## Feature 1: Coupon / รหัสส่วนลด

### ไฟล์หลัก:
- Schema: `src/db/schema/coupon.schema.ts`
- Repo: `src/features/coupon/coupon.repo.ts`
- Actions: `src/features/coupon/coupon.actions.ts`
- Admin UI: `src/app/dashboard/coupons/`
- Customer UI: `src/app/cart/cart-client.tsx` (กรอก coupon input)

### การทำงาน:
1. ลูกค้ากรอก coupon code ที่หน้า Cart
2. Frontend เรียก `validateCouponAction(code, orderAmount)` → ตรวจสอบ server-side
3. แสดงส่วนลดให้เห็น → ส่งค่า couponId, couponCode, couponDiscount ผ่าน URL params ไปหน้า checkout
4. ตอนสร้าง order: `createRentalOrderAction` รับ coupon params → บันทึกลง order + `recordCouponUsage()`
5. ราคาสุดท้าย = cartTotal - couponDiscount - walletCredit

### ประเภท coupon:
- `percent` — ลดเป็น % ของยอด
- `fixed` — ลดเป็นจำนวนเงินตายตัว (บาท)

### Validation:
- ตรวจ code ถูกต้อง / active / ไม่หมดอายุ / ยังไม่ถึง maxUses
- ตรวจลูกค้าไม่ได้ใช้ coupon นี้ไปแล้ว (1 คน 1 ครั้ง)
- ตรวจยอดขั้นต่ำ

---

## Feature 2: Notification System

### ไฟล์หลัก:
- Schema: `src/db/schema/notification-log.schema.ts`
- Repo: `src/features/notification/notification.repo.ts`
- Service: `src/features/notification/notification.service.ts`
- Admin UI: `src/app/dashboard/notifications/page.tsx`

### ช่องทาง:
1. **LINE Push** — ใช้ `pushLineTextMessage()` (มีอยู่แล้ว)
2. **Email** — ใช้ Resend API (fetch-based)

### Triggers อัตโนมัติ:
- Order `paid` → `sendOrderPaidNotification()` (hook ใน `updateOrderStatusAction`)
- Order `fulfilled` → `sendOrderFulfilledNotification()` (hook ใน `updateOrderStatusAction`)
- Waitlist available → `notifyWaitlistAction()` (Admin กด)
- Wallet credit → `sendWalletCreditNotification()` (เรียกเองถ้าต้องการ)

### ENV ที่ต้องตั้งค่า:
```env
RESEND_API_KEY=re_xxxxxxxxxxxx
NOTIFICATION_EMAIL_FROM=noreply@yourdomain.com
```

### Types notification:
`order_confirm`, `order_paid`, `order_fulfilled`, `order_cancelled`, `inventory_expiring`, `inventory_expired`, `waitlist_available`, `wallet_credit`, `wallet_debit`

---

## Feature 3: Auto-Renewal

### ไฟล์หลัก:
- Column: `auto_renew` (boolean) ใน `customer_inventories`
- Actions: `src/features/inventory/auto-renewal.actions.ts`
- Cron: `src/app/api/cron/auto-renewal/route.ts`
- Customer UI: `src/app/account/inventory/auto-renew-toggle.tsx`

### การทำงาน:
1. ลูกค้ากดสลับ toggle "ต่ออายุอัตโนมัติ" ที่หน้า `/account/inventory`
2. Cron job ที่ `GET /api/cron/auto-renewal` ตรวจหา inventory ที่ `expires_at <= NOW()` และ `auto_renew = true`
3. สร้าง renewal order และปิด auto_renew (กัน loop)

### Cron Secret:
```env
CRON_SECRET=your_secret_here
```
Call: `GET /api/cron/auto-renewal` with header `Authorization: Bearer {CRON_SECRET}`

### หมายเหตุ:
ปัจจุบัน auto-renew ปิด flag แล้วส่งแจ้งเตือนให้ลูกค้าต่ออายุเอง (Stripe auto-charge ต้องการ Customer ID เพิ่มเติม)

---

## Feature 4: Wallet / Credit

### ไฟล์หลัก:
- Schema: `src/db/schema/wallet.schema.ts` (tables: `customer_wallets`, `wallet_transactions`)
- Repo: `src/features/wallet/wallet.repo.ts`
- Actions: `src/features/wallet/wallet.actions.ts`
- Admin UI: `src/app/dashboard/wallets/page.tsx`, `src/app/dashboard/customers/[id]/add-credit-form.tsx`
- Customer UI: `src/app/account/wallet/page.tsx`

### การทำงาน:
1. **Admin เติม wallet** → หน้า `/dashboard/customers/[id]` มีฟอร์ม "เติม Wallet"
2. **ลูกค้าใช้ wallet** → หน้า Cart เปิด toggle "ใช้ Wallet" → ยอดถูกหักเมื่อสร้าง order
3. **Refund** → Admin เรียก `adminRefundToWalletAction` หรือทำผ่าน order management
4. ยอดคงเหลือแสดงที่ `/account/wallet`

### Functions หลัก:
- `getOrCreateWallet(customerId)` — ดึง wallet หรือสร้างใหม่
- `addWalletCredit(customerId, amount, description, adminId)` — เติมเงิน
- `debitWallet(customerId, amount, orderId, description)` — หักเงิน
- `refundToWallet(customerId, amount, orderId, description)` — คืนเงิน

---

## Feature 5: Waitlist

### ไฟล์หลัก:
- Schema: `src/db/schema/waitlist.schema.ts` (table: `product_waitlist`)
- Repo: `src/features/waitlist/waitlist.repo.ts`
- Actions: `src/features/waitlist/waitlist.actions.ts`
- Admin UI: `src/app/dashboard/waitlist/page.tsx`
- Customer UI: `src/app/account/waitlist/page.tsx`
- Product card: `src/app/rent/rent-client.tsx` (ProductCard component)

### การทำงาน:
1. สินค้าที่ `stock = 0` จะแสดงปุ่ม "🔔 แจ้งเตือนเมื่อมี stock" แทนปุ่มซื้อ (ต้อง login)
2. ลูกค้ากดปุ่ม → `joinWaitlistAction(productId)` → บันทึก record
3. Admin หน้า `/dashboard/waitlist` เห็น waitlist ต่อสินค้า → กดปุ่ม "แจ้งเตือนทั้งหมด" → ส่ง LINE push
4. ลูกค้าดู/ยกเลิก waitlist ได้ที่ `/account/waitlist`

### Status:
- `waiting` — รออยู่
- `notified` — แจ้งเตือนแล้ว
- `cancelled` — ยกเลิก

---

## Admin Sidebar Menus (เพิ่มใหม่)

ใน `src/components/app-sidebar.tsx`:
- **"จัดการสินค้า"** group เพิ่ม:
  - Coupon / รหัสส่วนลด → `/dashboard/coupons`
  - Waitlist → `/dashboard/waitlist`
- **Wallet ลูกค้า** → `/dashboard/wallets`
- **ประวัติแจ้งเตือน** → `/dashboard/notifications`

## Account Nav (เพิ่มใหม่)

ใน `src/components/account/AccountNav.tsx`:
- **Wallet** → `/account/wallet`
- **รอ stock** → `/account/waitlist`

---

## Checkout Flow (สรุป)

```
Cart Page (/cart)
  ├─ แสดง coupon input → validateCouponAction()
  ├─ แสดง wallet balance toggle
  └─ Link → /rent?checkout=1&couponId=X&couponCode=Y&couponDiscount=Z&walletCredit=W

Rent Page (/rent?checkout=1)
  ├─ อ่าน params จาก URL
  ├─ createRentalOrderAction({ items, couponId, couponCode, couponDiscount, walletCreditUsed })
  │   ├─ คำนวณ finalTotal = itemsTotal - couponDiscount - walletCreditUsed
  │   ├─ insert order กับ coupon/wallet fields
  │   ├─ recordCouponUsage() — เพิ่ม usedCount
  │   └─ debitWallet() — ตัดเงิน
  └─ /api/checkout → Stripe หรือ Bank Transfer
```

---

## Migration

หลังเพิ่ม features ใหม่ต้องรัน:
```bash
npm run db:generate   # generate migration files
npm run db:migrate    # apply to Turso DB
```

---

## ENV Variables ที่ต้องตั้งค่า (ทั้งหมด)

```env
# Turso/LibSQL
TURSO_CONNECTION_URL=libsql://...
TURSO_AUTH_TOKEN=...

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# LINE LIFF
NEXT_PUBLIC_LINE_LIFF_ID=...
LINE_CHANNEL_ACCESS_TOKEN=...

# S3/R2 File Upload
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
AWS_BUCKET_NAME=...
AWS_ENDPOINT_URL=...

# Email (Resend) — Feature 2 ✨ NEW
RESEND_API_KEY=re_...
NOTIFICATION_EMAIL_FROM=noreply@yourdomain.com

# Cron — Feature 3 ✨ NEW
CRON_SECRET=your_secure_random_secret
```

---

## TODO / ที่ยังค้างอยู่

1. **Notification order_confirm** — ยังไม่มี hook เมื่อ order สร้างใหม่ (ทำได้โดยเพิ่ม sendOrderConfirmNotification ใน createRentalOrderAction)
2. **Stripe auto-charge สำหรับ auto-renewal** — ต้องเก็บ Stripe Customer ID ในตาราง customers
3. **Coupon + Wallet ในหน้า Checkout ของ Admin** — ปัจจุบันใช้ได้แค่ผ่านหน้า customer cart เท่านั้น
4. **Email notification templates** — ปัจจุบัน hardcode ใน service, ควรย้ายไปเป็น settings/template
5. **Waitlist notification via Email** — ปัจจุบันส่งแค่ LINE, ควรเพิ่ม email

---

## Patterns ที่ใช้ในโปรเจกต์

### Server Action Pattern:
```typescript
"use server";
export async function someAction(_prev: State, formData: FormData): Promise<State> {
  const user = await getSessionUser(); // admin auth
  // หรือ
  const customer = await getCustomerSession(); // customer auth
  // ... logic
  revalidatePath("/dashboard/...");
  return { success: true };
}
```

### Repo Pattern:
- ใช้ Drizzle ORM โดยตรง
- ไม่มี ORM model class — query แบบ functional
- Drizzle query: `db.select().from(table).where(eq(table.col, val))`

### Schema Pattern:
```typescript
// src/db/schema/xxx.schema.ts
export const myTable = sqliteTable("my_table", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // ...
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull(),
});
```
