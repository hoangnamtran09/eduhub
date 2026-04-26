ALTER TABLE "User"
ADD COLUMN "dailyStudyReminder" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "newAssignmentNotification" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "weeklyEmailReport" BOOLEAN NOT NULL DEFAULT false;
