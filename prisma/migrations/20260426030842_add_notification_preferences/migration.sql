/*
  Warnings:

  - You are about to drop the column `semesterId` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `semesterId` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the `ChatHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PDFPage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Semester` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `AICo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subjectId` to the `Lesson` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'PARENT', 'ADMIN', 'TEACHER');

-- CreateEnum
CREATE TYPE "AssignmentRecipientStatus" AS ENUM ('ASSIGNED', 'ACCEPTED', 'SUBMITTED', 'REVIEWED', 'RETURNED');

-- DropForeignKey
ALTER TABLE "ChatHistory" DROP CONSTRAINT "ChatHistory_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_semesterId_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_semesterId_fkey";

-- DropForeignKey
ALTER TABLE "PDFPage" DROP CONSTRAINT "PDFPage_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Semester" DROP CONSTRAINT "Semester_subjectId_fkey";

-- DropIndex
DROP INDEX "Lesson_semesterId_idx";

-- AlterTable
ALTER TABLE "AICo" ADD COLUMN     "title" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "AIMessage" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "semesterId",
ADD COLUMN     "pdfStorageKey" TEXT;

-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "semesterId",
ADD COLUMN     "pdfStorageKey" TEXT,
ADD COLUMN     "subjectId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dailyStudyReminder" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "diamonds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "newAssignmentNotification" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
ADD COLUMN     "weeklyEmailReport" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "ChatHistory";

-- DropTable
DROP TABLE "PDFPage";

-- DropTable
DROP TABLE "Semester";

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "pdfStorageKey" TEXT,
    "lessonId" TEXT,
    "createdById" TEXT,
    "dueDate" TIMESTAMP(3),
    "maxScore" INTEGER NOT NULL DEFAULT 10,
    "rubric" JSONB,
    "targetGradeLevel" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentRecipient" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "AssignmentRecipientStatus" NOT NULL DEFAULT 'ASSIGNED',
    "submissionText" TEXT,
    "submissionFiles" JSONB,
    "score" INTEGER,
    "aiScore" INTEGER,
    "feedback" TEXT,
    "rubricScores" JSONB,
    "reviewedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentFeedbackEvent" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "status" "AssignmentRecipientStatus" NOT NULL,
    "score" INTEGER,
    "feedback" TEXT,
    "rubricScores" JSONB,
    "reviewerId" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentFeedbackEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT,
    "exerciseTitle" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "userAnswer" TEXT NOT NULL,
    "aiFeedback" TEXT,
    "score" INTEGER,
    "diamondsEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonWeakness" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "question" TEXT,
    "reason" TEXT NOT NULL,
    "aiFeedback" TEXT,
    "reviewExercises" JSONB,
    "score" INTEGER,
    "lastResult" BOOLEAN,
    "evidenceCount" INTEGER NOT NULL DEFAULT 1,
    "initialScore" INTEGER,
    "bestScore" INTEGER,
    "remediationCount" INTEGER NOT NULL DEFAULT 0,
    "remediatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonWeakness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemediationAttempt" (
    "id" TEXT NOT NULL,
    "weaknessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quizData" JSONB NOT NULL,
    "answers" JSONB,
    "score" INTEGER,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RemediationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssignmentRecipient_studentId_status_idx" ON "AssignmentRecipient"("studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentRecipient_assignmentId_studentId_key" ON "AssignmentRecipient"("assignmentId", "studentId");

-- CreateIndex
CREATE INDEX "AssignmentFeedbackEvent_recipientId_createdAt_idx" ON "AssignmentFeedbackEvent"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "LessonWeakness_userId_status_updatedAt_idx" ON "LessonWeakness"("userId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "LessonWeakness_lessonId_status_idx" ON "LessonWeakness"("lessonId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LessonWeakness_userId_lessonId_topic_key" ON "LessonWeakness"("userId", "lessonId", "topic");

-- CreateIndex
CREATE INDEX "RemediationAttempt_weaknessId_createdAt_idx" ON "RemediationAttempt"("weaknessId", "createdAt");

-- CreateIndex
CREATE INDEX "RemediationAttempt_userId_createdAt_idx" ON "RemediationAttempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AICo_userId_lessonId_updatedAt_idx" ON "AICo"("userId", "lessonId", "updatedAt");

-- CreateIndex
CREATE INDEX "AIMessage_conversationId_createdAt_idx" ON "AIMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Lesson_subjectId_idx" ON "Lesson"("subjectId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentRecipient" ADD CONSTRAINT "AssignmentRecipient_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentRecipient" ADD CONSTRAINT "AssignmentRecipient_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentFeedbackEvent" ADD CONSTRAINT "AssignmentFeedbackEvent_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "AssignmentRecipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonWeakness" ADD CONSTRAINT "LessonWeakness_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonWeakness" ADD CONSTRAINT "LessonWeakness_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationAttempt" ADD CONSTRAINT "RemediationAttempt_weaknessId_fkey" FOREIGN KEY ("weaknessId") REFERENCES "LessonWeakness"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationAttempt" ADD CONSTRAINT "RemediationAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
