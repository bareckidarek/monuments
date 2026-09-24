import { describe, expect, it } from "vitest";
import {
  catalogLabels,
  catalogLayoutState,
  catalogNavigationLabel,
  monumentBreadcrumbLabel,
  paginationLabel,
  responsiveCatalogContract
} from "./page-contracts";

describe("catalog page accessibility and responsive contracts", () => {
  it("provides labelled search/list/navigation landmarks in both locales", () => {
    expect(catalogLabels("en")).toMatchObject({ title: "Monument catalog", search: "Search" });
    expect(catalogLabels("pl")).toMatchObject({ title: "Katalog zabytków", search: "Szukaj" });
    expect(catalogNavigationLabel("en")).toBe("Catalog navigation");
    expect(monumentBreadcrumbLabel("pl")).toBe("Okruszki nawigacji");
    expect(paginationLabel("en")).toBe("Pagination");
  });

  it("keeps a deterministic responsive breakpoint contract", () => {
    expect(catalogLayoutState(640)).toBe("compact");
    expect(catalogLayoutState(641)).toBe("wide");
    expect(responsiveCatalogContract.compactMainPadding).toBe("1rem");
  });
});

