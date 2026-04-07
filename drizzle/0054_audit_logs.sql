-- ตาราง audit_logs เคยมีไฟล์ 0020 แต่ไม่ได้อยู่ใน journal — ใช้ IF NOT EXISTS เพื่อไม่พังถ้ามีอยู่แล้ว
CREATE TABLE IF NOT EXISTS `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`admin_user_id` integer,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`details` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE SET NULL
);
