import { describe, expect, it } from "vitest";
import { InMemoryImageMetadataStore, localizedAltText } from "./metadata";

const input = {
  monumentId: "monument-1", storageKey: "monument-1/original.png", originalFilename: "original.png",
  mimeType: "image/png", byteSize: 100, width: 10, height: 10,
  bytes: Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]), altTextPl: "Pomnik"
};

describe("image metadata persistence", () => {
  it("persists validated metadata with pending processing status", async () => {
    const store = new InMemoryImageMetadataStore();
    await expect(store.create(input)).resolves.toMatchObject({ storageKey: input.storageKey, processingStatus: "pending" });
  });

  it("uses the requested locale and Polish fallback for alt text", () => {
    expect(localizedAltText({ altTextPl: "Polski", altTextEn: "English" }, "en")).toBe("English");
    expect(localizedAltText({ altTextPl: "Polski", altTextEn: null }, "en")).toBe("Polski");
  });

  it("does not persist invalid metadata", async () => {
    const store = new InMemoryImageMetadataStore();
    await expect(store.create({ ...input, altTextPl: null, altTextEn: null })).rejects.toThrow("Invalid image metadata");
    expect(store.images).toHaveLength(0);
  });
});
