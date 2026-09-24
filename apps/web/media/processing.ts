export type ProcessingStatus = "pending" | "processing" | "ready" | "failed";

const transitions: Record<ProcessingStatus, readonly ProcessingStatus[]> = {
  pending: ["processing"],
  processing: ["ready", "failed"],
  ready: [],
  failed: ["pending", "processing"]
};

export function canTransition(from: ProcessingStatus, to: ProcessingStatus): boolean {
  return transitions[from].includes(to);
}

export function transitionProcessingStatus(from: ProcessingStatus, to: ProcessingStatus): ProcessingStatus {
  if (!canTransition(from, to)) throw new Error(`Invalid image processing transition: ${from} -> ${to}`);
  return to;
}

export async function processStoredImage(
  storage: { get(storageKey: string): Promise<Buffer> },
  storageKey: string,
  updateStatus: (status: ProcessingStatus) => Promise<void>,
  process: (data: Buffer) => Promise<void>
): Promise<ProcessingStatus> {
  await updateStatus("processing");
  try {
    await process(await storage.get(storageKey));
    await updateStatus("ready");
    return "ready";
  } catch {
    await updateStatus("failed");
    return "failed";
  }
}
