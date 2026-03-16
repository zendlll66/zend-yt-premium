-- ออเดอร์หนึ่งสามารถมีหลายรหัส (หลายแถวใน account_stock) ตาม quantity ใน order_items
DROP INDEX IF EXISTS account_stock_order_id_unique;
