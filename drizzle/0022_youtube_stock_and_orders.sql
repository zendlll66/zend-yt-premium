-- Core tables for YouTube Premium selling flow

-- Individual account stock
CREATE TABLE `account_stock` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `email` text NOT NULL,
  `password` text NOT NULL,
  `status` text NOT NULL DEFAULT 'available',
  `order_id` integer,
  `reserved_at` integer,
  `sold_at` integer,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `account_stock_status_idx` ON `account_stock` (`status`);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_stock_order_id_unique` ON `account_stock` (`order_id`);
--> statement-breakpoint

-- Family groups and members
CREATE TABLE `family_groups` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `limit` integer NOT NULL,
  `used` integer NOT NULL DEFAULT 0,
  `notes` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `family_groups_used_limit_idx` ON `family_groups` (`used`, `limit`);
--> statement-breakpoint

CREATE TABLE `family_members` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `family_group_id` integer NOT NULL,
  `customer_id` integer,
  `email` text NOT NULL,
  `order_id` integer,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`family_group_id`) REFERENCES `family_groups`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `family_members_order_id_unique` ON `family_members` (`order_id`);
--> statement-breakpoint
CREATE INDEX `family_members_family_group_idx` ON `family_members` (`family_group_id`);
--> statement-breakpoint

-- Invite links
CREATE TABLE `invite_links` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `link` text NOT NULL,
  `status` text NOT NULL DEFAULT 'available',
  `order_id` integer,
  `reserved_at` integer,
  `used_at` integer,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `invite_links_status_idx` ON `invite_links` (`status`);
--> statement-breakpoint
CREATE UNIQUE INDEX `invite_links_order_id_unique` ON `invite_links` (`order_id`);
--> statement-breakpoint

-- Customer-provided accounts
CREATE TABLE `customer_accounts` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `customer_id` integer NOT NULL,
  `email` text NOT NULL,
  `password` text NOT NULL,
  `order_id` integer NOT NULL,
  `status` text NOT NULL DEFAULT 'pending',
  `notes` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customer_accounts_order_id_unique` ON `customer_accounts` (`order_id`);
--> statement-breakpoint

-- Payments
CREATE TABLE `payments` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `order_id` integer NOT NULL,
  `provider` text NOT NULL,
  `transaction_id` text,
  `amount` real NOT NULL,
  `currency` text NOT NULL DEFAULT 'THB',
  `status` text NOT NULL DEFAULT 'pending',
  `paid_at` integer,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `payments_order_id_idx` ON `payments` (`order_id`);

