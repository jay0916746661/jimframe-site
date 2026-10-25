CREATE TABLE `hidden_photos` (
	`photo_id` text PRIMARY KEY NOT NULL,
	`album_key` text NOT NULL,
	`hidden_by` text NOT NULL,
	`hidden_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `hidden_photos_album_idx` ON `hidden_photos` (`album_key`);