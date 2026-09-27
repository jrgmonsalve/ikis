CREATE TABLE `commitment_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`commitment_id` text NOT NULL,
	`period` text NOT NULL,
	`paid_at` integer NOT NULL,
	FOREIGN KEY (`commitment_id`) REFERENCES `commitments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `commitment_payments_family_id_commitment_id_period_unique` ON `commitment_payments` (`family_id`,`commitment_id`,`period`);--> statement-breakpoint
CREATE TABLE `commitments` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`name` text NOT NULL,
	`amount_limit` integer NOT NULL,
	`due_day` integer NOT NULL,
	`notify_days_before` integer DEFAULT 3 NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL
);
