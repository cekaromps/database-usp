import { prisma } from "@/lib/prisma";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export async function sendPushToAll(
  title: string,
  body: string,
  data?: Record<string, any>,
) {
  const tokens = await prisma.pushToken.findMany();
  if (tokens.length === 0) return;

  const messages = tokens.map((t) => ({
    to: t.token,
    sound: "default",
    title,
    body,
    data: data ?? {},
  }));

  const chunkSize = 100; // Expo's recommended batch size
  const invalidTokens: string[] = [];

  for (let i = 0; i < messages.length; i += chunkSize) {
    const chunk = messages.slice(i, i + chunkSize);
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify(chunk),
    });
    const result = await res.json().catch(() => null);

    if (Array.isArray(result?.data)) {
      result.data.forEach((ticket: any, idx: number) => {
        if (
          ticket.status === "error" &&
          ticket.details?.error === "DeviceNotRegistered"
        ) {
          invalidTokens.push(chunk[idx].to);
        }
      });
    }
  }

  // Clean up tokens for uninstalled apps so they stop erroring forever
  if (invalidTokens.length > 0) {
    await prisma.pushToken.deleteMany({
      where: { token: { in: invalidTokens } },
    });
  }
}
