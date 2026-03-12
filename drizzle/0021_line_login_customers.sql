-- Add LINE LIFF login fields to customers (auto register/login)
ALTER TABLE `customers` ADD COLUMN `line_user_id` text;
--> statement-breakpoint
ALTER TABLE `customers` ADD COLUMN `line_display_name` text;
--> statement-breakpoint
ALTER TABLE `customers` ADD COLUMN `line_picture_url` text;
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_line_user_id_unique` ON `customers` (`line_user_id`);
