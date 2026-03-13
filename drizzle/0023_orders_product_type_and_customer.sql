-- Extend orders for YouTube product types and customer relation

ALTER TABLE `orders` ADD COLUMN `product_type` text NOT NULL DEFAULT 'individual';
--> statement-breakpoint
ALTER TABLE `orders` ADD COLUMN `customer_id` integer REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null;
--> statement-breakpoint
ALTER TABLE `orders` ADD COLUMN `updated_at` integer;

