/*
  Warnings:

  - You are about to drop the column `matchId` on the `Move` table. All the data in the column will be lost.
  - You are about to drop the column `participantId` on the `Move` table. All the data in the column will be lost.
  - You are about to drop the column `toTileId` on the `Move` table. All the data in the column will be lost.
  - You are about to drop the column `matchId` on the `Tile` table. All the data in the column will be lost.
  - You are about to drop the column `unitId` on the `Tile` table. All the data in the column will be lost.
  - You are about to drop the column `participantId` on the `Unit` table. All the data in the column will be lost.
  - You are about to drop the column `tileId` on the `Unit` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[moveId]` on the table `Unit` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `initiatorId` to the `Move` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rotationCount` to the `Move` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetId` to the `Move` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitConstellationName` to the `Move` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitId` to the `Move` table without a default value. This is not possible if the table is not empty.
  - Added the required column `moveId` to the `Unit` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Move" DROP CONSTRAINT "Move_matchId_fkey";

-- DropForeignKey
ALTER TABLE "Move" DROP CONSTRAINT "Move_participantId_fkey";

-- DropForeignKey
ALTER TABLE "Unit" DROP CONSTRAINT "Unit_participantId_fkey";

-- DropForeignKey
ALTER TABLE "Unit" DROP CONSTRAINT "Unit_tileId_fkey";

-- DropIndex
DROP INDEX "Unit_tileId_key";

-- AlterTable
ALTER TABLE "Move" DROP COLUMN "matchId",
DROP COLUMN "participantId",
DROP COLUMN "toTileId",
ADD COLUMN     "initiatorId" TEXT NOT NULL,
ADD COLUMN     "rotationCount" INTEGER NOT NULL,
ADD COLUMN     "targetId" TEXT NOT NULL,
ADD COLUMN     "unitConstellationName" TEXT NOT NULL,
ADD COLUMN     "unitId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Tile" DROP COLUMN "matchId",
DROP COLUMN "unitId",
ADD COLUMN     "mapId" TEXT,
ADD COLUMN     "visible" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Unit" DROP COLUMN "participantId",
DROP COLUMN "tileId",
ADD COLUMN     "moveId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Map" (
    "id" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "colCount" INTEGER NOT NULL,
    "matchId" TEXT NOT NULL,

    CONSTRAINT "Map_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitConstellation" (
    "name" TEXT NOT NULL,
    "row1" INTEGER NOT NULL,
    "col1" INTEGER NOT NULL,
    "row2" INTEGER,
    "col2" INTEGER,
    "row3" INTEGER,
    "col3" INTEGER,
    "row4" INTEGER,
    "col4" INTEGER,
    "row5" INTEGER,
    "col5" INTEGER,
    "row6" INTEGER,
    "col6" INTEGER,
    "row7" INTEGER,
    "col7" INTEGER,
    "row8" INTEGER,
    "col8" INTEGER,
    "row9" INTEGER,
    "col9" INTEGER,

    CONSTRAINT "UnitConstellation_pkey" PRIMARY KEY ("name")
);

-- CreateIndex
CREATE UNIQUE INDEX "Map_matchId_key" ON "Map"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_moveId_key" ON "Unit"("moveId");

-- AddForeignKey
ALTER TABLE "Map" ADD CONSTRAINT "Map_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Move" ADD CONSTRAINT "Move_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Move" ADD CONSTRAINT "Move_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Tile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Move" ADD CONSTRAINT "Move_unitConstellationName_fkey" FOREIGN KEY ("unitConstellationName") REFERENCES "UnitConstellation"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tile" ADD CONSTRAINT "Tile_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "Move"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
