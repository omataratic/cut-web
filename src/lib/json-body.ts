type ReadMessages = {
  notJson: string;
  tooLarge: string;
  bad: string;
};

export async function readLimitedJson(
  request: Request,
  maxBytes: number,
  messages: ReadMessages,
): Promise<
  | { ok: true; value: unknown }
  | { ok: false; status: number; error: string }
> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return { ok: false, status: 400, error: messages.notJson };
  }

  const lengthHeader = request.headers.get("content-length");
  if (lengthHeader) {
    const length = Number(lengthHeader);
    if (!Number.isFinite(length) || length < 0 || length > maxBytes) {
      return { ok: false, status: 413, error: messages.tooLarge };
    }
  }

  try {
    const reader = request.body?.getReader();
    if (!reader) return { ok: false, status: 400, error: messages.bad };
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return { ok: false, status: 413, error: messages.tooLarge };
      }
      chunks.push(value);
    }
    const text = new TextDecoder().decode(
      chunks.length === 1 ? chunks[0] : Buffer.concat(chunks),
    );
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, status: 400, error: messages.bad };
  }
}

export function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
