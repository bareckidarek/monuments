import type { Pool } from "pg";
import { validateImageBoundary, type ImageValidationInput, type ImageValidationOptions } from "./validation";

export type ImageMetadata = ImageValidationInput & {
  monumentId: string;
  storageKey: string;
  originalFilename: string;
  sortOrder?: number;
  captionPl?: string | null;
  captionEn?: string | null;
  provenance?: string | null;
  license?: string | null;
};

export type StoredImageMetadata = ImageMetadata & {
  id: string;
  processingStatus: "pending" | "processing" | "ready" | "failed";
};

export type ImageMetadataStore = {
  create(input: ImageMetadata): Promise<StoredImageMetadata>;
};

export function localizedAltText(image: Pick<ImageMetadata, "altTextPl" | "altTextEn">, locale: "pl" | "en"): string {
  const value = locale === "en" ? image.altTextEn ?? image.altTextPl : image.altTextPl ?? image.altTextEn;
  if (!value?.trim()) throw new Error("Image metadata has no usable alt text");
  return value.trim();
}

export class InMemoryImageMetadataStore implements ImageMetadataStore {
  readonly images: StoredImageMetadata[] = [];

  constructor(private readonly options?: ImageValidationOptions) {}

  async create(input: ImageMetadata): Promise<StoredImageMetadata> {
    const errors = validateImageBoundary(input, this.options);
    if (errors.length) throw new Error(`Invalid image metadata: ${errors.map((error) => error.code).join(",")}`);
    const image: StoredImageMetadata = {
      ...input,
      id: `image-${this.images.length + 1}`,
      sortOrder: input.sortOrder ?? 0,
      processingStatus: "pending"
    };
    this.images.push(image);
    return image;
  }
}

export async function persistImageMetadata(
  pool: Pool,
  input: ImageMetadata,
  options?: ImageValidationOptions
): Promise<{ id: string; processingStatus: StoredImageMetadata["processingStatus"] }> {
  const errors = validateImageBoundary(input, options);
  if (errors.length) throw new Error(`Invalid image metadata: ${errors.map((error) => error.code).join(",")}`);
  const result = await pool.query<{ id: string; processing_status: StoredImageMetadata["processingStatus"] }>(
    `INSERT INTO monument_image
      (monument_id, storage_key, original_filename, mime_type, byte_size, width, height, sort_order,
       alt_text_pl, alt_text_en, caption_pl, caption_en, provenance, license, processing_status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'pending')
     RETURNING id, processing_status`,
    [
      input.monumentId, input.storageKey, input.originalFilename, input.mimeType, input.byteSize,
      input.width, input.height, input.sortOrder ?? 0, input.altTextPl ?? null, input.altTextEn ?? null,
      input.captionPl ?? null, input.captionEn ?? null, input.provenance ?? null, input.license ?? null
    ]
  );
  return { id: result.rows[0].id, processingStatus: result.rows[0].processing_status };
}
