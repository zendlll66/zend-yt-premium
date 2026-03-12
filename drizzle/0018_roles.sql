CREATE TABLE `roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_slug_unique` ON `roles` (`slug`);
--> statement-breakpoint
INSERT INTO `roles` (`slug`, `name`, `description`, `created_at`, `updated_at`) VALUES
('super_admin', 'Super Admin', 'สิทธิ์สูงสุด จัดการทุกอย่างรวมถึงสิทธิ์การเข้าถึง', strftime('%s', 'now'), strftime('%s', 'now')),
('admin', 'แอดมิน', 'จัดการสินค้า หมวดหมู่ โปรโมชัน แผนสมาชิก ตั้งค่า', strftime('%s', 'now'), strftime('%s', 'now')),
('cashier', 'แคชเชียร์', 'ดูคำสั่งเช่า ลูกค้า จอแสดงผล', strftime('%s', 'now'), strftime('%s', 'now')),
('chef', 'เชฟ', 'ดูคำสั่งเช่า จอแสดงผล', strftime('%s', 'now'), strftime('%s', 'now'));
