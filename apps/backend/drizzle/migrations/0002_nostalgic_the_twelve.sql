CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`parent_id` text,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
