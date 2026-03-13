CREATE TABLE `customer_inventories` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `customer_id` integer NOT NULL,
  `order_id` integer NOT NULL,
  `item_type` text NOT NULL,
  `title` text NOT NULL,
  `login_email` text,
  `login_password` text,
  `invite_link` text,
  `note` text,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
