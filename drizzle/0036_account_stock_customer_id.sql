-- เก็บ customer_id ตอน assign stock ให้ลูกค้าหลังชำระเงิน (รู้ว่า user ไหนใช้รหัสนี้)
ALTER TABLE `account_stock` ADD COLUMN `customer_id` integer;
