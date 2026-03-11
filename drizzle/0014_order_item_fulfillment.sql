ALTER TABLE `order_items` ADD COLUMN `fulfillment_status` text;
--> statement-breakpoint
ALTER TABLE `order_items` ADD COLUMN `fulfillment_updated_at` integer;
