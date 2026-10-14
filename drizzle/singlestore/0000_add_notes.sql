CREATE TABLE `drive_tutorial_notes` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `drive_tutorial_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `notes_owner_index` ON `drive_tutorial_notes` (`owner_id`);