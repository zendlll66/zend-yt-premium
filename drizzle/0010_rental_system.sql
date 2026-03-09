-- 1. order_items: ลบ kitchen_order_id, status
PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE _order_items_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  total_price REAL NOT NULL
);
--> statement-breakpoint
INSERT INTO _order_items_new (id, order_id, product_id, product_name, price, quantity, total_price)
SELECT id, order_id, product_id, product_name, price, quantity, total_price FROM order_items;
--> statement-breakpoint
DROP TABLE order_items;
--> statement-breakpoint
ALTER TABLE _order_items_new RENAME TO order_items;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
--> statement-breakpoint
DROP TABLE IF EXISTS kitchen_orders;
--> statement-breakpoint
-- 2. orders: เพิ่มคอลัมน์ แล้วลบ table_id (สร้างตารางใหม่)
ALTER TABLE orders ADD COLUMN deposit_amount REAL DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN rental_start INTEGER;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN rental_end INTEGER;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN customer_name TEXT;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN customer_email TEXT;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN customer_phone TEXT;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN stripe_payment_intent_id TEXT;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN stripe_payment_status TEXT;
--> statement-breakpoint
UPDATE orders SET customer_name = 'N/A', customer_email = 'N/A', deposit_amount = 0 WHERE customer_name IS NULL;
--> statement-breakpoint
UPDATE orders SET rental_start = created_at, rental_end = created_at WHERE rental_start IS NULL AND created_at IS NOT NULL;
--> statement-breakpoint
PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE _orders_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  order_number TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' NOT NULL,
  total_price REAL NOT NULL,
  deposit_amount REAL DEFAULT 0 NOT NULL,
  rental_start INTEGER,
  rental_end INTEGER,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  stripe_payment_intent_id TEXT,
  stripe_payment_status TEXT,
  created_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
INSERT INTO _orders_new (id, order_number, status, total_price, deposit_amount, rental_start, rental_end, customer_name, customer_email, customer_phone, stripe_payment_intent_id, stripe_payment_status, created_by, created_at)
SELECT id, order_number, status, total_price, coalesce(deposit_amount, 0), rental_start, rental_end, coalesce(customer_name, 'N/A'), coalesce(customer_email, 'N/A'), customer_phone, stripe_payment_intent_id, stripe_payment_status, created_by, created_at FROM orders;
--> statement-breakpoint
DROP TABLE orders;
--> statement-breakpoint
ALTER TABLE _orders_new RENAME TO orders;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
--> statement-breakpoint
DROP TABLE IF EXISTS tables;
--> statement-breakpoint
DROP TABLE IF EXISTS kitchen_categories;
--> statement-breakpoint
ALTER TABLE products ADD COLUMN deposit REAL;
--> statement-breakpoint
ALTER TABLE products ADD COLUMN description TEXT;
--> statement-breakpoint
-- 3. products: ลบ kitchen_category_id
PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE _products_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  price REAL NOT NULL,
  deposit REAL,
  cost REAL,
  sku TEXT,
  barcode TEXT,
  image_url TEXT,
  description TEXT,
  is_active INTEGER DEFAULT 1 NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
INSERT INTO _products_new (id, name, category_id, price, deposit, cost, sku, barcode, image_url, description, is_active, created_at)
SELECT id, name, category_id, price, deposit, cost, sku, barcode, image_url, description, is_active, created_at FROM products;
--> statement-breakpoint
DROP TABLE products;
--> statement-breakpoint
ALTER TABLE _products_new RENAME TO products;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
