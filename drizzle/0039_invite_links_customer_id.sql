-- เพิ่ม customer_id เพื่อผูก invite link กับลูกค้าโดยตรง (ใช้แสดงผลเหมือน account_stock)
ALTER TABLE invite_links ADD COLUMN customer_id integer;

