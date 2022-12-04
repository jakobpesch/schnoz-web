-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "activePlayerId" TEXT;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_activePlayerId_fkey" FOREIGN KEY ("activePlayerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
