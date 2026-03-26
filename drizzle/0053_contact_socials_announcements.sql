CREATE TABLE `contact_socials` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `label` text NOT NULL,
  `platform` text NOT NULL,
  `url` text NOT NULL,
  `sort_order` integer NOT NULL DEFAULT 0,
  `is_enabled` integer NOT NULL DEFAULT 1,
  `created_at` integer NOT NULL
);

CREATE TABLE `announcements` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `title` text NOT NULL,
  `content` text NOT NULL DEFAULT '',
  `is_enabled` integer NOT NULL DEFAULT 1,
  `starts_at` integer,
  `ends_at` integer,
  `sort_order` integer NOT NULL DEFAULT 0,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
