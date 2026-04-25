DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LessonProgressStatus') THEN
        CREATE TYPE "LessonProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');
    END IF;
END $$;

ALTER TABLE "LessonProgress"
    ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "lastStudiedAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "lastPage" INTEGER,
    ADD COLUMN IF NOT EXISTS "totalStudySec" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "status" "LessonProgressStatus" NOT NULL DEFAULT 'NOT_STARTED';

CREATE TABLE IF NOT EXISTS "StudySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "lastPingAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudySession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StudySession_userId_startedAt_idx" ON "StudySession"("userId", "startedAt");
CREATE INDEX IF NOT EXISTS "StudySession_lessonId_startedAt_idx" ON "StudySession"("lessonId", "startedAt");
CREATE INDEX IF NOT EXISTS "LessonProgress_userId_status_idx" ON "LessonProgress"("userId", "status");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'StudySession_lessonId_fkey'
    ) THEN
        ALTER TABLE "StudySession"
            ADD CONSTRAINT "StudySession_lessonId_fkey"
            FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'StudySession_userId_fkey'
    ) THEN
        ALTER TABLE "StudySession"
            ADD CONSTRAINT "StudySession_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
