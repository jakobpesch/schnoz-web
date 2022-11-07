/*
  Warnings:

  - You are about to drop the column `unitId` on the `Move` table. All the data in the column will be lost.
  - You are about to drop the column `moveId` on the `Unit` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[mapId]` on the table `Tile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tileId]` on the table `Unit` will be added. If there are existing duplicate values, this will fail.
  - Made the column `mapId` on table `Tile` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `tileId` to the `Unit` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Tile" DROP CONSTRAINT "Tile_mapId_fkey";

-- DropForeignKey
ALTER TABLE "Unit" DROP CONSTRAINT "Unit_moveId_fkey";

-- DropIndex
DROP INDEX "Unit_moveId_key";

-- AlterTable
ALTER TABLE "Move" DROP COLUMN "unitId";

-- AlterTable
ALTER TABLE "Tile" ALTER COLUMN "mapId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Unit" DROP COLUMN "moveId",
ADD COLUMN     "tileId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Tile_mapId_key" ON "Tile"("mapId");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_tileId_key" ON "Unit"("tileId");

-- AddForeignKey
ALTER TABLE "Tile" ADD CONSTRAINT "Tile_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_tileId_fkey" FOREIGN KEY ("tileId") REFERENCES "Tile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
