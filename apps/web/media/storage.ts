import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export type MediaStorage = {
  put(storageKey: string, data: Uint8Array): Promise<void>;
  get(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
  pathFor(storageKey: string): string;
};

export function safeStorageKey(storageKey: string): string {
  const normalized = storageKey.replaceAll("\\", "/");
  if (!normalized || normalized.startsWith("/") || normalized.includes("\0")) throw new Error("Invalid storage key");
  const segments = normalized.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === ".." || !/^[a-zA-Z0-9._-]+$/.test(segment))) {
    throw new Error("Invalid storage key");
  }
  return segments.join("/");
}

export class LocalFilesystemStorage implements MediaStorage {
  constructor(private readonly root: string) {}

  pathFor(storageKey: string): string {
    const safeKey = safeStorageKey(storageKey);
    const root = path.resolve(this.root);
    const target = path.resolve(root, safeKey);
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) throw new Error("Storage key escapes root");
    return target;
  }

  async put(storageKey: string, data: Uint8Array): Promise<void> {
    const target = this.pathFor(storageKey);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, data, { flag: "wx" });
  }

  async get(storageKey: string): Promise<Buffer> {
    return readFile(this.pathFor(storageKey));
  }

  async delete(storageKey: string): Promise<void> {
    await rm(this.pathFor(storageKey), { force: true });
  }
}
