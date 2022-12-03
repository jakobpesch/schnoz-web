-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_activePlayerId_fkey";

-- AlterTable
ALTER TABLE "Unit" ADD COLUMN     "ownerId" TEXT;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_activePlayerId_fkey" FOREIGN KEY ("activePlayerId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
