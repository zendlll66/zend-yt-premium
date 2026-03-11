CREATE TABLE `customer_cart_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`product_id` integer,
	`product_name` text NOT NULL,
	`price` real NOT NULL,
	`quantity` integer NOT NULL,
	`modifiers_json` text DEFAULT '[]' NOT NULL,
	`rental_start` text NOT NULL,
	`rental_end` text NOT NULL,
	`delivery_option` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null
);
