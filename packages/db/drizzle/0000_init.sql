CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE "public"."document_status" AS ENUM('pending', 'processing', 'ready', 'failed');
CREATE TYPE "public"."document_source" AS ENUM('pdf', 'note', 'faq');
CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant', 'system');
CREATE TYPE "public"."ticket_status" AS ENUM('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE "public"."ticket_priority" AS ENUM('low', 'medium', 'high');

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "title" text NOT NULL,
  "source_type" "document_source" NOT NULL,
  "storage_key" text,
  "raw_content" text,
  "status" "document_status" DEFAULT 'pending' NOT NULL,
  "error_message" text,
  "char_count" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "chunks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "document_id" uuid NOT NULL REFERENCES "documents"("id") ON DELETE cascade,
  "ordinal" integer NOT NULL,
  "content" text NOT NULL,
  "embedding" vector(1536),
  "token_count" integer,
  "metadata" jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS "chat_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "visitor_id" text NOT NULL,
  "user_agent" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "human_takeover" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL REFERENCES "chat_sessions"("id") ON DELETE cascade,
  "role" "message_role" NOT NULL,
  "content" text NOT NULL,
  "citations" jsonb DEFAULT '[]'::jsonb,
  "tool_calls" jsonb DEFAULT '[]'::jsonb,
  "response_time_ms" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "tickets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid REFERENCES "chat_sessions"("id") ON DELETE set null,
  "subject" text NOT NULL,
  "description" text NOT NULL,
  "status" "ticket_status" DEFAULT 'open' NOT NULL,
  "priority" "ticket_priority" DEFAULT 'medium' NOT NULL,
  "assigned_to" uuid REFERENCES "users"("id") ON DELETE set null,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_number" text NOT NULL UNIQUE,
  "customer_email" text NOT NULL,
  "status" text NOT NULL,
  "items" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "total" real NOT NULL,
  "estimated_delivery" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "documents_user_id_created_at_idx" ON "documents" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "documents_status_idx" ON "documents" ("status");
CREATE INDEX IF NOT EXISTS "chunks_document_id_idx" ON "chunks" ("document_id");
CREATE INDEX IF NOT EXISTS "chunks_embedding_idx" ON "chunks" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX IF NOT EXISTS "chat_sessions_visitor_id_idx" ON "chat_sessions" ("visitor_id");
CREATE INDEX IF NOT EXISTS "messages_session_id_created_at_idx" ON "messages" ("session_id", "created_at");
CREATE INDEX IF NOT EXISTS "tickets_status_idx" ON "tickets" ("status");
CREATE INDEX IF NOT EXISTS "tickets_created_at_idx" ON "tickets" ("created_at");
