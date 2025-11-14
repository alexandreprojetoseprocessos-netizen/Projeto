const { prisma } = require("./apps/database/dist");

async function main() {
  const memberships = await prisma.organizationMembership.findMany({
    where: { userId: "8a4e59dd-f2dc-455d-b484-9b9e35d24d3d" },
    include: { organization: true }
  });
  console.log(memberships);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
