import { describe, expect, it } from "vitest";
import { catalogRepository } from "./runtime-repository";

describe("runtime catalog source", () => {
  it("provides published demo records with Polish fallback", async () => {
    const page = await catalogRepository.listPublished({ page: 1, pageSize: 20, locale: "en" });
    expect(page.total).toBe(2);
    expect(page.items.find((item) => item.slug === "zamek-na-wawelu")?.translations[0]?.name).toBe("Zamek na Wawelu");
  });
});
