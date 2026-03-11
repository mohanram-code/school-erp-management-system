import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // --- CONFIGURATION: YOUR ADMIN DETAILS ---
  const primaryAdminId = "user_35Ebhe62pYMpOzUtlUrQXtFL4Nr";
  const primaryAdminUsername = "sreenath";
  // --------------------------------------------

  console.log("🧹 Cleaning database...");

  // Delete all existing data in correct order (to avoid foreign key conflicts)
  await prisma.result.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.event.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.student.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.class.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.admin.deleteMany();

  console.log("✅ Database cleaned successfully!");

  // Create ONLY the primary admin (YOU)
  await prisma.admin.create({
    data: {
      id: primaryAdminId,
      username: primaryAdminUsername,
    },
  });

  console.log("✅ Admin user created: sreenath");

  // Create basic grade structure (1-12 for a school)
  for (let i = 1; i <= 12; i++) {
    await prisma.grade.create({
      data: {
        level: i,
      },
    });
  }

  console.log("✅ Grades 1-12 created");

  // Create basic subjects (can be customized later)
  const subjectData = [
    { name: "Mathematics" },
    { name: "Science" },
    { name: "English" },
    { name: "Social Studies" },
    { name: "Arts & Crafts" },
    { name: "Physical Education" },
    { name: "Music" },
    { name: "Computer Science" },
  ];

  for (const subject of subjectData) {
    await prisma.subject.create({ data: subject });
  }

  console.log("✅ Basic subjects created");

  console.log("🎉 Seeding completed! Database is ready for production use.");
  console.log("📝 You can now add students, teachers, and classes through the admin panel.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });