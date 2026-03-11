import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("WEBHOOK_SECRET is not set");
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, username, first_name, last_name, public_metadata } = evt.data;

    const role = (public_metadata as { role?: string })?.role;
    const email = email_addresses[0]?.email_address;

    if (!role || !email) {
      return new Response("Missing role or email", { status: 400 });
    }

    try {
      switch (role) {
        case "teacher":
          await prisma.teacher.create({
            data: {
              id: id,
              username: username || email.split("@")[0],
              name: first_name || "Teacher",
              surname: last_name || "User",
              email: email,
              phone: "0000000000",
              address: "Not provided",
              bloodType: "O+",
              sex: "MALE",
              birthday: new Date("1990-01-01"),
            },
          });
          console.log("Teacher created successfully");
          break;

        case "student":
          // You'll need to handle parentId assignment properly
          console.log("Student creation requires parent assignment");
          break;

        case "parent":
          await prisma.parent.create({
            data: {
              id: id,
              username: username || email.split("@")[0],
              name: first_name || "Parent",
              surname: last_name || "User",
              email: email,
              phone: "0000000000",
              address: "Not provided",
            },
          });
          console.log("Parent created successfully");
          break;

        case "admin":
          await prisma.admin.create({
            data: {
              id: id,
              username: username || email.split("@")[0],
            },
          });
          console.log("Admin created successfully");
          break;

        default:
          console.log("Unknown role:", role);
      }

      return NextResponse.json({ message: "User synced to database" });
    } catch (error) {
      console.error("Database error:", error);
      return new Response("Database error", { status: 500 });
    }
  }

  return new Response("", { status: 200 });
}
