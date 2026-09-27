ALTER TABLE `commitment_payments` ADD `transaction_id` text NOT NULL REFERENCES transactions(id) ON DELETE cascade;--> statement-breakpoint
ALTER TABLE `commitments` ADD `account_id` text NOT NULL REFERENCES accounts(id) ON DELETE cascade;--> statement-breakpoint
ALTER TABLE `commitments` ADD `category_id` text REFERENCES categories(id) ON DELETE set null;