CREATE TABLE `migration_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer,
	`contact_email` text NOT NULL,
	`stock_type` text NOT NULL,
	`login_email` text NOT NULL,
	`login_password` text,
	`note` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`admin_note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null
);
