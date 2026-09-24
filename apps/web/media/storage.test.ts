import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LocalFilesystemStorage, safeStorageKey } from "./storage";

describe("local media storage", () => {
  it("normalizes only safe relative storage keys", () => {
    expect(safeStorageKey("monument-1/photo.png")).toBe("monument-1/photo.png");
    expect(() => safeStorageKey("../outside.png")).toThrow();
    expect(() => safeStorageKey("/absolute.png")).toThrow();
    expect(() => safeStorageKey("monument/../outside.png")).toThrow();
  });

  it("stores and deletes files below the configured root", async () => {
    const root = await mkdtemp(`.media-test-${process.pid}-`);
    const storage = new LocalFilesystemStorage(root);
    await storage.put("monument/photo.png", Uint8Array.from([1, 2, 3]));
    await expect(readFile(storage.pathFor("monument/photo.png"))).resolves.toEqual(Buffer.from([1, 2, 3]));
    await storage.delete("monument/photo.png");
    await expect(storage.get("monument/photo.png")).rejects.toThrow();
    await rm(root, { recursive: true, force: true });
  });
});
