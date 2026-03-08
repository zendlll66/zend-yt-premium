ALTER TABLE `tables` ADD `qr_token` text;--> statement-breakpoint
CREATE UNIQUE INDEX `tables_qr_token_unique` ON `tables` (`qr_token`);