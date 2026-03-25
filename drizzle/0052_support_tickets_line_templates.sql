CREATE TABLE `support_tickets` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `customer_id` integer NOT NULL REFERENCES `customers`(`id`) ON DELETE CASCADE,
  `order_id` integer REFERENCES `orders`(`id`) ON DELETE SET NULL,
  `subject` text NOT NULL,
  `description` text NOT NULL,
  `status` text NOT NULL DEFAULT 'pending',
  `admin_note` text,
  `admin_id` integer REFERENCES `admin_users`(`id`) ON DELETE SET NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE TABLE `line_message_templates` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `key` text NOT NULL UNIQUE,
  `name` text NOT NULL,
  `template` text NOT NULL,
  `is_enabled` integer NOT NULL DEFAULT 1,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

-- Default templates
INSERT INTO `line_message_templates` (`key`, `name`, `template`, `is_enabled`, `created_at`, `updated_at`) VALUES
('ticket_created', 'แจ้งปัญหาใหม่ (แจ้ง Admin)', '📩 แจ้งปัญหาใหม่ #{{ticketId}}
ลูกค้า: {{customerName}}
หัวข้อ: {{subject}}
วันที่: {{date}}', 1, unixepoch(), unixepoch()),
('ticket_pending', 'รอรับเรื่อง (แจ้งลูกค้า)', '📋 ได้รับเรื่องของคุณแล้ว #{{ticketId}}
หัวข้อ: {{subject}}
สถานะ: {{status}}
ทีมงาน {{shopName}} จะดำเนินการโดยเร็ว', 1, unixepoch(), unixepoch()),
('ticket_in_progress', 'กำลังแก้ไข (แจ้งลูกค้า)', '🔧 กำลังดำเนินการ #{{ticketId}}
หัวข้อ: {{subject}}
สถานะ: {{status}}
ทีมงาน {{shopName}} กำลังแก้ไขปัญหาของคุณ', 1, unixepoch(), unixepoch()),
('ticket_resolved', 'แก้ไขเรียบร้อย (แจ้งลูกค้า)', '✅ แก้ไขเรียบร้อย #{{ticketId}}
หัวข้อ: {{subject}}
สถานะ: {{status}}
หมายเหตุ: {{adminNote}}

หากยังมีปัญหากรุณาแจ้งอีกครั้ง', 1, unixepoch(), unixepoch()),
('ticket_closed', 'ปิดเรื่อง (แจ้งลูกค้า)', '🔒 ปิดเรื่อง #{{ticketId}}
หัวข้อ: {{subject}}
ขอบคุณที่ใช้บริการ {{shopName}}', 1, unixepoch(), unixepoch());
