CREATE TABLE `sessions` (
	`code` text PRIMARY KEY NOT NULL,
	`teacher_token` text NOT NULL,
	`state` text NOT NULL,
	`updated_at` integer NOT NULL
);
