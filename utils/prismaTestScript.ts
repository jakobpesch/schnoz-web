const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function main() {
  // await prisma.participant.deleteMany()
  // await prisma.match.deleteMany()
  // await prisma.user.deleteMany()
  // const user1 = await prisma.user.create({
  //   data: {
  //     email: "jakob@schnoz.gg",
  //   },
  // })
  // const user2 = await prisma.user.create({
  //   data: {
  //     email: "isin@schnoz.gg",
  //   },
  // })

  // const match = await prisma.match.create({
  //   data: {
  //     createdById: user1.id,
  //     maxPlayers: 2,
  //     players: {
  //       create: {
  //         userId: user1.id,
  //       },
  //     },
  //   },
  // })

  // console.log(match)

  // const updatedMatch = await prisma.match.update({
  //   where: {
  //     id: match.id,
  //   },
  //   data: {
  //     status: "STARTED",
  //     players: {
  //       create: {
  //         userId: user2.id,
  //       },
  //     },
  //   },
  //   include: {
  //     players: {
  //       include: {
  //         user: true,
  //       },
  //     },
  //   },
  // })

  const match = await prisma.match.findFirst({
    include: { players: true },
  })

  // const map = await prisma.map.create({
  //   data: {
  //     match: { connect: { id: match.id } },
  //     rowCount: 3,
  //     colCount: 3,
  //     tiles: {
  //       create: [
  //         { row: 0, col: 0 },
  //         { row: 0, col: 1, terrain: "WATER" },
  //         { row: 0, col: 2 },
  //         { row: 1, col: 0, terrain: "WATER" },
  //         {
  //           row: 1,
  //           col: 1,
  //           unit: {
  //             create: {
  //               type: "MAIN_BUILDING",
  //             },
  //           },
  //         },
  //         { row: 1, col: 2 },
  //         { row: 2, col: 0, terrain: "STONE" },
  //         { row: 2, col: 1 },
  //         { row: 2, col: 2, terrain: "TREE" },
  //       ],
  //     },
  //   },
  // })

  // console.log(map)
  const tile = await prisma.tile.findFirst()
  // const unitConst = await prisma.unitConstellation.create({
  //   data: { name: "I", row1: 0, col1: 0, row2: 0, col2: 1 },
  // })
  const move = await prisma.move.create({
    data: {
      initiatorId: match.players[0].id,
      rotationCount: 0,
      unitConstellationName: "I",
      targetId: tile.id,
    },
  })

  console.log(move)

  // console.log(updatedMatch.players)
  // await prisma.match.deleteMany()
  // await prisma.match.create({
  //   data: {
  //     crea
  //   },
  // })
}

main()
  .catch((e) => {
    console.log(e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
