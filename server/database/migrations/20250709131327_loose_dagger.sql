CREATE TABLE "chart_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chart_id" varchar(100) NOT NULL,
	"chart_data" jsonb NOT NULL,
	"week" varchar(10) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chart_snapshots_chart_id_week_unique" UNIQUE("chart_id","week")
);
--> statement-breakpoint
CREATE TABLE "favorite_songs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"song_position" integer NOT NULL,
	"chart_id" varchar(100) NOT NULL,
	"song_name" varchar(255) NOT NULL,
	"artist_name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "favorite_songs_user_chart_song_unique" UNIQUE("user_id","chart_id","song_position")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "favorite_songs" ADD CONSTRAINT "favorite_songs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chart_snapshots_chart_id_idx" ON "chart_snapshots" USING btree ("chart_id");--> statement-breakpoint
CREATE INDEX "chart_snapshots_week_idx" ON "chart_snapshots" USING btree ("week");--> statement-breakpoint
CREATE INDEX "favorite_songs_user_id_idx" ON "favorite_songs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "favorite_songs_chart_id_idx" ON "favorite_songs" USING btree ("chart_id");--> statement-breakpoint
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_sessions_session_token_idx" ON "user_sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");