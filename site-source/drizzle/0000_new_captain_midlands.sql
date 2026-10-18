CREATE TABLE `click_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_type` text NOT NULL,
	`album_key` text,
	`venue` text,
	`album_date` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
