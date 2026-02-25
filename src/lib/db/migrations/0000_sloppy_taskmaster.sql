CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text,
	`entity_type` text,
	`action` text NOT NULL,
	`title` text NOT NULL,
	`metadata` text,
	`source` text DEFAULT 'local' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `daily_summaries` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`total_minutes` integer DEFAULT 0 NOT NULL,
	`project_breakdown` text,
	`tasks_completed` integer DEFAULT 0 NOT NULL,
	`ideas_created` integer DEFAULT 0 NOT NULL,
	`articles_written` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_summaries_date_unique` ON `daily_summaries` (`date`);--> statement-breakpoint
CREATE TABLE `embeddings` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`vector` text NOT NULL,
	`content` text NOT NULL,
	`model` text DEFAULT 'text-embedding-3-small' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ideas` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`stage` text DEFAULT 'spark' NOT NULL,
	`category` text,
	`project_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `integration_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`data_type` text NOT NULL,
	`data` text NOT NULL,
	`fetched_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `integration_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`enabled` integer DEFAULT true,
	`config` text,
	`last_sync_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `integration_configs_provider_unique` ON `integration_configs` (`provider`);--> statement-breakpoint
CREATE TABLE `kb_articles` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`summary` text,
	`pinned` integer DEFAULT false,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `kb_articles_slug_unique` ON `kb_articles` (`slug`);--> statement-breakpoint
CREATE TABLE `project_health` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`date` text NOT NULL,
	`completion_rate` integer,
	`overdue_rate` integer,
	`velocity` integer,
	`health_score` integer,
	`computed_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'active' NOT NULL,
	`priority` text,
	`color` text DEFAULT '#5B7FD6',
	`start_date` integer,
	`target_date` integer,
	`completed_date` integer,
	`external_id` text,
	`external_source` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tag_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`tag_id` text NOT NULL,
	`entity_id` text NOT NULL,
	`entity_type` text NOT NULL,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#5B7FD6'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'todo' NOT NULL,
	`priority` text,
	`due_date` integer,
	`completed_date` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`external_id` text,
	`external_source` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `time_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`task_id` text,
	`type` text NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`duration` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE set null
);
