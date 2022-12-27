/*
  Warnings:

  - You are about to drop the column `initiatorId` on the `Move` table. All the data in the column will be lost.
  - Added the required column `matchId` to the `Move` table without a default value. This is not possible if the table is not empty.
  - Added the required column `participantId` to the `Move` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Rule" AS ENUM ('TERRAIN_WATER_POSITIVE', 'TERRAIN_STONE_NEGATIVE', 'HOLE');

-- DropForeignKey
ALTER TABLE "Move" DROP CONSTRAINT "Move_initiatorId_fkey";

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "Rule" "Rule"[];

-- AlterTable
ALTER TABLE "Move" DROP COLUMN "initiatorId",
ADD COLUMN     "matchId" TEXT NOT NULL,
ADD COLUMN     "participantId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Move" ADD CONSTRAINT "Move_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Move" ADD CONSTRAINT "Move_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
