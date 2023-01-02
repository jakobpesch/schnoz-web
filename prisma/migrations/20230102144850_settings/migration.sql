-- CreateEnum
CREATE TYPE "UnitConstellation" AS ENUM ('r0c0_r0c1', 'r0c0_r1c1', 'r0c0_r0c1_r1c1', 'r0c0_r0c1_r1c2', 'r0c0_r0c1_r0c2_r1c2', 'r0c0_r0c1_r1c1_r1c2', 'r0c0_r0c1_r2c0_r2c1');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('UNIT', 'MAIN_BUILDING');

-- CreateEnum
CREATE TYPE "Terrain" AS ENUM ('WATER', 'TREE', 'STONE');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('CREATED', 'STARTED', 'FINISHED');

-- CreateEnum
CREATE TYPE "Rule" AS ENUM ('TERRAIN_WATER_POSITIVE', 'TERRAIN_STONE_NEGATIVE', 'HOLE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255),
    "email" VARCHAR(255),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "playerNumber" INTEGER NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "maxPlayers" INTEGER NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'CREATED',
    "activePlayerId" TEXT,
    "winnerId" TEXT,
    "turn" INTEGER NOT NULL DEFAULT 0,
    "maxTurns" INTEGER NOT NULL DEFAULT 12,
    "openCards" "UnitConstellation"[] DEFAULT ARRAY[]::"UnitConstellation"[],
    "Rule" "Rule"[],

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSettings" (
    "id" TEXT NOT NULL,
    "mapSize" INTEGER NOT NULL DEFAULT 11,
    "matchId" TEXT NOT NULL,

    CONSTRAINT "GameSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Map" (
    "id" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "colCount" INTEGER NOT NULL,
    "matchId" TEXT NOT NULL,

    CONSTRAINT "Map_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tile" (
    "id" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "col" INTEGER NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT false,
    "terrain" "Terrain",
    "mapId" TEXT NOT NULL,

    CONSTRAINT "Tile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Move" (
    "id" TEXT NOT NULL,
    "rotationCount" INTEGER NOT NULL,
    "participantId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,

    CONSTRAINT "Move_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "type" "UnitType" NOT NULL,
    "ownerId" TEXT,
    "tileId" TEXT NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Match_activePlayerId_key" ON "Match"("activePlayerId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_winnerId_key" ON "Match"("winnerId");

-- CreateIndex
CREATE UNIQUE INDEX "GameSettings_matchId_key" ON "GameSettings"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "Map_matchId_key" ON "Map"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_tileId_key" ON "Unit"("tileId");

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_activePlayerId_fkey" FOREIGN KEY ("activePlayerId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSettings" ADD CONSTRAINT "GameSettings_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Map" ADD CONSTRAINT "Map_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tile" ADD CONSTRAINT "Tile_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Move" ADD CONSTRAINT "Move_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Move" ADD CONSTRAINT "Move_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Tile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Move" ADD CONSTRAINT "Move_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_tileId_fkey" FOREIGN KEY ("tileId") REFERENCES "Tile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
