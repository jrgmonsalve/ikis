CREATE TABLE `budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`category_id` text NOT NULL,
	`period` text NOT NULL,
	`amount_limit` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `budgets_family_id_category_id_period_unique` ON `budgets` (`family_id`,`category_id`,`period`);