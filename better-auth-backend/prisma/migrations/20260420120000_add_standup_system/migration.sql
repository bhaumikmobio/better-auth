-- CreateTable
CREATE TABLE "standup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "yesterday" TEXT NOT NULL,
    "today" TEXT NOT NULL,
    "blockers" TEXT NOT NULL,
    "mood" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "standup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reaction" (
    "id" TEXT NOT NULL,
    "standupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "dailyPrompt" TEXT NOT NULL DEFAULT 'What is your main goal today?',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "standup_userId_idx" ON "standup"("userId");

-- CreateIndex
CREATE INDEX "standup_createdAt_idx" ON "standup"("createdAt");

-- CreateIndex
CREATE INDEX "reaction_standupId_idx" ON "reaction"("standupId");

-- CreateIndex
CREATE INDEX "reaction_userId_idx" ON "reaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "reaction_standupId_userId_emoji_key" ON "reaction"("standupId", "userId", "emoji");

-- AddForeignKey
ALTER TABLE "standup" ADD CONSTRAINT "standup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaction" ADD CONSTRAINT "reaction_standupId_fkey" FOREIGN KEY ("standupId") REFERENCES "standup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaction" ADD CONSTRAINT "reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
