-- Add low_stock_threshold to products for low-stock alerts
ALTER TABLE products ADD COLUMN low_stock_threshold INTEGER;
