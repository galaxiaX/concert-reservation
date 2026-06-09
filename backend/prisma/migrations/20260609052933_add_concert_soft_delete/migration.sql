-- AlterTable
ALTER TABLE "Concert" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Concert_deletedAt_idx" ON "Concert"("deletedAt");
