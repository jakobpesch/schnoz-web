-- DropForeignKey
ALTER TABLE "Unit" DROP CONSTRAINT "Unit_tileId_fkey";

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_tileId_fkey" FOREIGN KEY ("tileId") REFERENCES "Tile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
