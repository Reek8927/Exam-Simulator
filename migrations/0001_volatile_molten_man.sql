CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'admin',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "admins_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "notices" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"priority" text DEFAULT 'normal',
	"is_pinned" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"visible_from" timestamp DEFAULT now(),
	"visible_till" timestamp,
	"created_by_admin_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "negative_marks" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "negative_marks" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "exam_attempts" ALTER COLUMN "status" SET DEFAULT 'in_progress';--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "father_name" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "mother_name" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "permanent_address" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "present_address" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "application_status" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "documents_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "verification_remark" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "exam_id" integer;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "roll_number" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "admit_card_issued" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "exam_date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "start_time" text NOT NULL;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "is_active" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "result_declared" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "answer_key_published" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "marks" integer DEFAULT 4;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD COLUMN "correct_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD COLUMN "wrong_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD COLUMN "skipped_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD COLUMN "total_marks_obtained" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD COLUMN "percentile" real;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD COLUMN "result_calculated" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD COLUMN "result_published" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_created_by_admin_id_admins_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_attempt_id_exam_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "address";--> statement-breakpoint
ALTER TABLE "exam_attempts" DROP COLUMN "score";--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_student_id_unique" UNIQUE("student_id");--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_roll_number_unique" UNIQUE("roll_number");