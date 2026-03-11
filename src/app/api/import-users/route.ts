import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import * as XLSX from "xlsx";

export async function POST(request: Request) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Excel file is empty or invalid" },
        { status: 400 }
      );
    }

    const results = { success: 0, skipped: 0, errors: [] as string[] };

    for (let i = 0; i < data.length; i++) {
      const row: any = data[i];
      
      // Skip completely empty rows
      const hasAnyData = Object.values(row).some(
        (val) => val !== null && val !== undefined && val.toString().trim() !== ""
      );

      if (!hasAnyData) {
        console.log(`Skipping empty row ${i + 2}`);
        continue;
      }

      try {
        if (type === "teacher") {
          await importTeacher(row, i + 2);
        } else if (type === "student") {
          await importStudent(row, i + 2);
        } else if (type === "parent") {
          await importParent(row, i + 2);
        }
        results.success++;
      } catch (error: any) {
        console.error(`Row ${i + 2} error:`, error);
        if (error.message.includes("already exists") || error.message.includes("Unique constraint")) {
          results.skipped++;
        } else {
          results.errors.push(`Row ${i + 2}: ${error.message}`);
        }
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: error.message || "Import failed" },
      { status: 500 }
    );
  }
}

async function importTeacher(row: any, rowNum: number) {
  const email = row.Email?.toString().trim();
  const username = row.Username?.toString().trim();
  const name = row.Name?.toString().trim();
  const surname = row.Surname?.toString().trim();

  if (!email || !username || !name || !surname) {
    throw new Error(`Missing required fields (Email, Username, Name, or Surname)`);
  }

  // Check if already exists in database
  const existing = await prisma.teacher.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existing) {
    throw new Error("Teacher already exists");
  }

  try {
    // Create in Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.createUser({
      emailAddress: [email],
      password: row.Password?.toString().trim() || "Welcome@123",
      username: username,
      firstName: name,
      lastName: surname,
      publicMetadata: { role: "teacher" },
    });

    // Parse birthday
    let birthday = new Date("1990-01-01");
    if (row.Birthday) {
      const birthdayStr = row.Birthday.toString().trim();
      const parsedDate = new Date(birthdayStr);
      if (!isNaN(parsedDate.getTime())) {
        birthday = parsedDate;
      }
    }

    // Create in Prisma
    await prisma.teacher.create({
      data: {
        id: clerkUser.id,
        username: username,
        name: name,
        surname: surname,
        email: email,
        phone: row.Phone?.toString().trim() || null,
        address: row.Address?.toString().trim() || "Not provided",
        bloodType: row.BloodType?.toString().trim() || "O+",
        sex: (row.Sex?.toString().trim().toUpperCase() === "FEMALE" ? "FEMALE" : "MALE") as "MALE" | "FEMALE",
        birthday: birthday,
      },
    });
  } catch (error: any) {
    if (error.message.includes("Unique constraint")) {
      throw new Error("Teacher already exists");
    }
    throw error;
  }
}

async function importStudent(row: any, rowNum: number) {
  const email = row.Email?.toString().trim();
  const username = row.Username?.toString().trim();
  const name = row.Name?.toString().trim();
  const surname = row.Surname?.toString().trim();
  const parentEmail = row.ParentEmail?.toString().trim();
  const gradeLevel = parseInt(row.GradeLevel?.toString().trim() || "1");
  const className = row.ClassName?.toString().trim();

  if (!username || !name || !surname || !className) {
    throw new Error(`Missing required fields (Username, Name, Surname, ClassName)`);
  }

  // Check if already exists
  const existing = await prisma.student.findFirst({
    where: { 
      OR: email ? [{ email }, { username }] : [{ username }]
    },
  });

  if (existing) {
    throw new Error("Student already exists");
  }

  // Handle parent - OPTIONAL now (thanks to schema change)
  let parentId: string | null = null;
  
  if (parentEmail && parentEmail !== "") {
    let parent = await prisma.parent.findFirst({
      where: { email: parentEmail },
    });

    // Don't create parent automatically - just skip if not found
    if (parent) {
      parentId = parent.id;
    }
  }

  // Find or create grade
  let grade = await prisma.grade.findFirst({
    where: { level: gradeLevel },
  });

  if (!grade) {
    grade = await prisma.grade.create({
      data: { level: gradeLevel },
    });
  }

  // Find or create class
  let classRecord = await prisma.class.findFirst({
    where: { 
      name: className,
      gradeId: grade.id 
    },
  });

  if (!classRecord) {
    classRecord = await prisma.class.create({
      data: {
        name: className,
        capacity: 30,
        gradeId: grade.id,
      },
    });
  }

  try {
    // Create in Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.createUser({
      emailAddress: email ? [email] : undefined,
      password: row.Password?.toString().trim() || "Welcome@123",
      username: username,
      firstName: name,
      lastName: surname,
      publicMetadata: { role: "student" },
    });

    // Parse birthday
    let birthday = new Date("2015-01-01");
    if (row.Birthday) {
      const birthdayStr = row.Birthday.toString().trim();
      const parsedDate = new Date(birthdayStr);
      if (!isNaN(parsedDate.getTime())) {
        birthday = parsedDate;
      }
    }

    // Create in Prisma - parentId is now optional!
    await prisma.student.create({
      data: {
        id: clerkUser.id,
        username: username,
        name: name,
        surname: surname,
        email: email || null,
        phone: row.Phone?.toString().trim() || null,
        address: row.Address?.toString().trim() || "Not provided",
        bloodType: row.BloodType?.toString().trim() || "O+",
        sex: (row.Sex?.toString().trim().toUpperCase() === "FEMALE" ? "FEMALE" : "MALE") as "MALE" | "FEMALE",
        birthday: birthday,
        parentId: parentId, // Can be null now!
        gradeId: grade.id,
        classId: classRecord.id,
      },
    });
  } catch (error: any) {
    if (error.message.includes("Unique constraint")) {
      throw new Error("Student already exists");
    }
    throw error;
  }
}

async function importParent(row: any, rowNum: number) {
  const email = row.Email?.toString().trim();
  const username = row.Username?.toString().trim();
  const name = row.Name?.toString().trim();
  const surname = row.Surname?.toString().trim();
  const phone = row.Phone?.toString().trim();

  if (!email || !username || !name || !surname || !phone) {
    throw new Error(`Missing required fields`);
  }

  // Check if already exists
  const existing = await prisma.parent.findFirst({
    where: { OR: [{ email }, { username }, { phone }] },
  });

  if (existing) {
    throw new Error("Parent already exists");
  }

  try {
    // Create in Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.createUser({
      emailAddress: [email],
      password: row.Password?.toString().trim() || "Welcome@123",
      username: username,
      firstName: name,
      lastName: surname,
      publicMetadata: { role: "parent" },
    });

    // Create in Prisma
    await prisma.parent.create({
      data: {
        id: clerkUser.id,
        username: username,
        name: name,
        surname: surname,
        email: email,
        phone: phone,
        address: row.Address?.toString().trim() || "Not provided",
      },
    });
  } catch (error: any) {
    if (error.message.includes("Unique constraint")) {
      throw new Error("Parent already exists");
    }
    throw error;
  }
}