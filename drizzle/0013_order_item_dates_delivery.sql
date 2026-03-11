ALTER TABLE `order_items` ADD COLUMN `rental_start` integer;
--> statement-breakpoint
ALTER TABLE `order_items` ADD COLUMN `rental_end` integer;
--> statement-breakpoint
ALTER TABLE `order_items` ADD COLUMN `delivery_option` text;
