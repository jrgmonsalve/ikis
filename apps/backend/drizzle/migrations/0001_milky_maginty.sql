CREATE TABLE `families` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `users` ADD `family_id` text REFERENCES families(id);