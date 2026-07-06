ALTER TABLE `families` RENAME COLUMN `budget_cycle_start_day` TO `budget_cycle_end_day`;--> statement-breakpoint
UPDATE `families` SET `budget_cycle_end_day` = CASE WHEN `budget_cycle_end_day` = 1 THEN 31 ELSE `budget_cycle_end_day` - 1 END;--> statement-breakpoint
ALTER TABLE `budgets` ADD `period_end` text NOT NULL DEFAULT '';--> statement-breakpoint
UPDATE `budgets` SET `period_end` = date(`period`, '+1 month', '-1 day');
