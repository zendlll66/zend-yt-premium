CREATE TABLE `modifier_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`required` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `modifiers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` integer NOT NULL,
	`name` text NOT NULL,
	`price` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `modifier_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `product_modifiers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`modifier_group_id` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`modifier_group_id`) REFERENCES `modifier_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_modifiers_product_group` ON `product_modifiers` (`product_id`,`modifier_group_id`);