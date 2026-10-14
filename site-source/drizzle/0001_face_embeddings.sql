CREATE TABLE IF NOT EXISTS `face_embeddings` (
	`photo_id` text PRIMARY KEY NOT NULL,
	`album_key` text NOT NULL,
	`descriptors` text NOT NULL,
	`image_hash` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `face_embeddings_album_idx` ON `face_embeddings` (`album_key`);
