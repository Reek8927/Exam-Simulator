CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"dob" date,
	"gender" text,
	"category" text,
	"nationality" text,
	"state_of_eligibility" text,
	"aadhaar_number" text,
	"pwd" boolean DEFAULT false,
	"parents_income" text,
	"address" text,
	"class10_board" text,
	"class10_year" integer,
	"class10_roll" text,
	"class12_status" text,
	"class12_board" text,
	"class12_school" text,
	"class12_year" integer,
	"photo_url" text,
	"signature_url" text,
	"class10_cert_url" text,
	"category_cert_url" text,
	"payment_status" text DEFAULT 'pending',
	"payment_txn_id" text,
	"payment_amount" integer,
	"current_step" integer DEFAULT 1,
	"submitted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"duration_minutes" integer NOT NULL,
	"total_marks" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam_id" integer NOT NULL,
	"subject" text NOT NULL,
	"text" text NOT NULL,
	"image_url" text,
	"options" jsonb,
	"correct_option" integer,
	"correct_numeric_answer" real,
	"type" text NOT NULL,
	"negative_marks" integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"mobile" text NOT NULL,
	"application_no" text NOT NULL,
	"student_id" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "students_email_unique" UNIQUE("email"),
	CONSTRAINT "students_application_no_unique" UNIQUE("application_no"),
	CONSTRAINT "students_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "exam_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"start_time" timestamp DEFAULT now(),
	"end_time" timestamp,
	"score" integer,
	"status" text DEFAULT 'in-progress'
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"selected_answer" text,
	"status" text DEFAULT 'not_visited',
	"time_spent" integer DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;