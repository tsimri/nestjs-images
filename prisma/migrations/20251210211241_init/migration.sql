-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateTable
CREATE TABLE "images" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "url" VARCHAR(2048) NOT NULL,
    "title" VARCHAR(255),
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'processing',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex

CREATE INDEX "images_title_trgm_idx"
    ON "images" USING GIN ("title" "gin_trgm_ops");

CREATE INDEX "images_not_deleted_created_at_desc_idx"
    ON "images" ("created_at" DESC)
    WHERE "deleted_at" IS NULL;