import type { Colorway, Size } from "./colorways";

export type SubscribeInput = {
  email: string;
  colorway: Colorway;
  size?: Size | "";
};

export type SubscribeResult = { ok: true } | { ok: false; error: "server" | "network" };

/**
 * Klaviyo client subscriptions for Drop 001.
 * Env: NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY, NEXT_PUBLIC_KLAVIYO_LIST_ID.
 * Missing either → simulated success after 400 ms (dev warning only).
 */
export async function subscribe(input: SubscribeInput): Promise<SubscribeResult> {
  const publicKey = process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY?.trim() ?? "";
  const listId = process.env.NEXT_PUBLIC_KLAVIYO_LIST_ID?.trim() ?? "";

  if (!publicKey || !listId) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[klaviyo] NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY or NEXT_PUBLIC_KLAVIYO_LIST_ID missing; simulating signup.");
    }
    await new Promise((r) => setTimeout(r, 400));
    return { ok: true };
  }

  const properties: Record<string, string> = {
    drop001_colorway: `${input.colorway.id} ${input.colorway.name}`,
  };
  if (input.size) properties.drop001_size = input.size;

  try {
    const res = await fetch(
      `https://a.klaviyo.com/client/subscriptions/?company_id=${encodeURIComponent(publicKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          revision: "2024-10-15",
        },
        body: JSON.stringify({
          data: {
            type: "subscription",
            attributes: {
              profile: {
                data: {
                  type: "profile",
                  attributes: {
                    email: input.email.trim(),
                    properties,
                  },
                },
              },
            },
            relationships: {
              list: {
                data: {
                  type: "list",
                  id: listId,
                },
              },
            },
          },
        }),
      },
    );
    if (res.ok || res.status === 202) return { ok: true };
    return { ok: false, error: "server" };
  } catch {
    return { ok: false, error: "network" };
  }
}
