CREATE TABLE `kitchen_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tables` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`table_number` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`capacity` integer DEFAULT 4 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tables_table_number_unique` ON `tables` (`table_number`);--> statement-breakpoint
ALTER TABLE `orders` ADD `table_id` integer REFERENCES tables(id);--> statement-breakpoint
ALTER TABLE `products` ADD `kitchen_category_id` integer REFERENCES kitchen_categories(id);