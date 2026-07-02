import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { createDb, documents, orders, users } from "./index";

const DEMO_EMAIL = "admin@cx-demo.com";
const DEMO_PASSWORD = "demo12345";

const faqDocuments = [
  {
    title: "Refund Policy",
    sourceType: "faq" as const,
    rawContent:
      "Q: How do I request a refund?\nA: Refunds are available within 30 days of purchase. Go to Settings > Billing > Request Refund, or contact support with your order number.\n\nQ: How long do refunds take?\nA: Approved refunds appear on your original payment method within 5-7 business days.",
  },
  {
    title: "Shipping & Delivery",
    sourceType: "faq" as const,
    rawContent:
      "Q: What are shipping options?\nA: We offer Standard (5-7 days, free over $50), Express (2-3 days, $9.99), and Overnight ($19.99).\n\nQ: How do I track my order?\nA: Use your order number (e.g. ORD-1001) in the chat or check the confirmation email for a tracking link.",
  },
  {
    title: "Account & Billing",
    sourceType: "faq" as const,
    rawContent:
      "Q: How do I update my payment method?\nA: Go to Settings > Billing > Payment Methods and add or remove cards.\n\nQ: Can I change my subscription plan?\nA: Yes. Upgrade or downgrade anytime under Settings > Subscription. Changes apply at the next billing cycle.",
  },
  {
    title: "Technical Support",
    sourceType: "faq" as const,
    rawContent:
      "Q: The app won't load. What should I do?\nA: Clear cache, try incognito mode, and ensure you're on the latest version. If the issue persists, escalate to a human agent.\n\nQ: How do I reset my password?\nA: Click Forgot Password on the login page. A reset link expires in 1 hour.",
  },
];

const demoOrders = [
  {
    orderNumber: "ORD-1001",
    customerEmail: "customer@example.com",
    status: "shipped",
    items: ["Pro Plan (Annual)", "Onboarding Kit"],
    total: 299.0,
    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  },
  {
    orderNumber: "ORD-1002",
    customerEmail: "customer@example.com",
    status: "processing",
    items: ["Starter Plan (Monthly)"],
    total: 29.0,
    estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  },
  {
    orderNumber: "ORD-1003",
    customerEmail: "vip@example.com",
    status: "delivered",
    items: ["Enterprise Plan", "Priority Support Add-on"],
    total: 999.0,
    estimatedDelivery: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

async function main() {
  const connectionString =
    process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5434/cx_support";
  const db = createDb(connectionString);

  const existing = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
  let userId: string;

  if (existing[0]) {
    userId = existing[0].id;
    console.log("Demo admin already exists:", DEMO_EMAIL);
  } else {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const [user] = await db
      .insert(users)
      .values({ email: DEMO_EMAIL, passwordHash, name: "Demo Admin" })
      .returning();
    if (!user) throw new Error("Failed to create demo user");
    userId = user.id;
    console.log("Created demo admin:", DEMO_EMAIL, "password:", DEMO_PASSWORD);
  }

  for (const doc of faqDocuments) {
    const existingDocRows = await db
      .select()
      .from(documents)
      .where(eq(documents.title, doc.title))
      .limit(1);
    const existingDoc = existingDocRows[0];
    if (!existingDoc) {
      await db.insert(documents).values({
        userId,
        title: doc.title,
        sourceType: doc.sourceType,
        rawContent: doc.rawContent,
        status: "pending",
        charCount: doc.rawContent.length,
      });
      console.log("Queued document for ingestion:", doc.title);
    }
  }

  for (const order of demoOrders) {
    const existingOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, order.orderNumber))
      .limit(1);
    if (!existingOrder[0]) {
      await db.insert(orders).values(order);
      console.log("Seeded order:", order.orderNumber);
    }
  }

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
