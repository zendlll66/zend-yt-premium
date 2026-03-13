const LINE_PUSH_API = "https://api.line.me/v2/bot/message/push";

export async function pushLineTextMessage(lineUserId: string, text: string): Promise<boolean> {
  const token =
    process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN ||
    process.env.LINE_CHANNEL_ACCESS_TOKEN ||
    "";
  if (!lineUserId || !text.trim()) {
    console.warn("[LINE] Skip push message: missing lineUserId or text");
    return false;
  }
  if (!token) {
    console.warn("[LINE] Skip push message: missing LINE_MESSAGING_CHANNEL_ACCESS_TOKEN");
    return false;
  }

  try {
    const res = await fetch(LINE_PUSH_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: "text", text }],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[LINE] Push message failed (${res.status}): ${body}`);
      return false;
    }
    return res.ok;
  } catch (error) {
    console.error("[LINE] Push message error:", error);
    return false;
  }
}

