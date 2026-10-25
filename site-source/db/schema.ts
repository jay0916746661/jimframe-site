import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const clickEvents = sqliteTable("click_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventType: text("event_type").notNull(),
  albumKey: text("album_key"),
  venue: text("venue"),
  albumDate: text("album_date"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("click_events_type_key_idx").on(table.eventType, table.albumKey)]);

export const faceEmbeddings = sqliteTable("face_embeddings", {
  photoId: text("photo_id").primaryKey(),
  albumKey: text("album_key").notNull(),
  descriptors: text("descriptors").notNull(),
  imageHash: text("image_hash").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("face_embeddings_album_idx").on(table.albumKey)]);

// SFace embeddings (face search v2). face_embeddings above holds old face-api data and is no longer used.
export const faceEmbeddingsSf = sqliteTable("face_embeddings_sf", {
  photoId: text("photo_id").primaryKey(),
  albumKey: text("album_key").notNull(),
  descriptors: text("descriptors").notNull(),
  imageHash: text("image_hash").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("face_embeddings_sf_album_idx").on(table.albumKey)]);

export const hiddenPhotos = sqliteTable("hidden_photos", {
  photoId: text("photo_id").primaryKey(),
  albumKey: text("album_key").notNull(),
  hiddenBy: text("hidden_by").notNull(),
  hiddenAt: text("hidden_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("hidden_photos_album_idx").on(table.albumKey)]);
