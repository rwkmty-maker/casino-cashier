import { hashSync } from "bcryptjs"
import { PrismaClient } from "../lib/generated/prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Seed default admin user. Change the password after first login.
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123"

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Administrator",
      email: "admin@example.com",
      passwordHash: hashSync(adminPassword, 10),
      role: "ADMIN",
    },
  })

  // House account must exist once for double-entry bookkeeping.
  await prisma.account.upsert({
    where: { id: "house" },
    update: {},
    create: { id: "house", type: "HOUSE", balance: 0 },
  })

  // Seed default play sites (up to 5).
  const siteNames = ["Site A", "Site B", "Site C", "Site D", "Site E"]
  for (const [index, name] of siteNames.entries()) {
    const slug = `site-${String.fromCharCode(97 + index)}`
    const site = await prisma.site.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        slug,
        order: index,
        status: "ACTIVE",
      },
    })
    await prisma.account.upsert({
      where: { siteId: site.id },
      update: {},
      create: { type: "SITE", balance: 0, siteId: site.id },
    })
  }

  // Seed 25 seats (physical PC terminals).
  for (let i = 1; i <= 25; i++) {
    await prisma.seat.upsert({
      where: { number: i },
      update: {},
      create: { number: i, name: `Seat ${i}`, status: "AVAILABLE" },
    })
  }

  console.log(`Seeded admin user: ${admin.email}`)
  console.log("Seeded 5 sites and 25 seats.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
