export const SUPPORTED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export type SupportedImageMimeType = (typeof SUPPORTED_IMAGE_MIME_TYPES)[number];

export type ImageValidationInput = {
  mimeType: string;
  byteSize: number;
  width: number;
  height: number;
  bytes?: Uint8Array;
  altTextPl?: string | null;
  altTextEn?: string | null;
};

export type ImageValidationOptions = {
  maxBytes?: number;
  maxWidth?: number;
  maxHeight?: number;
  maxAltLength?: number;
};

export type ImageValidationError = {
  field: string;
  code: "mime" | "size" | "dimensions" | "alt-text" | "content";
  message: string;
};

const signatures: Record<SupportedImageMimeType, (bytes: Uint8Array) => boolean> = {
  "image/jpeg": (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  "image/png": (bytes) => bytes.length >= 8 && bytes.slice(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index]),
  "image/webp": (bytes) =>
    bytes.length >= 12 &&
    new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP",
  "image/gif": (bytes) => {
    const header = new TextDecoder().decode(bytes.slice(0, 6));
    return header === "GIF87a" || header === "GIF89a";
  }
};

export function validateImageBoundary(
  input: ImageValidationInput,
  options: ImageValidationOptions = {}
): ImageValidationError[] {
  const maxBytes = options.maxBytes ?? 10 * 1024 * 1024;
  const maxWidth = options.maxWidth ?? 10_000;
  const maxHeight = options.maxHeight ?? 10_000;
  const maxAltLength = options.maxAltLength ?? 500;
  const errors: ImageValidationError[] = [];
  const mimeType = input.mimeType.toLowerCase();

  if (!SUPPORTED_IMAGE_MIME_TYPES.includes(mimeType as SupportedImageMimeType)) {
    errors.push({ field: "mimeType", code: "mime", message: "Unsupported image MIME type" });
  } else if (input.bytes && !signatures[mimeType as SupportedImageMimeType](input.bytes)) {
    errors.push({ field: "bytes", code: "content", message: "Image content does not match its MIME type" });
  }
  if (!Number.isInteger(input.byteSize) || input.byteSize <= 0 || input.byteSize > maxBytes) {
    errors.push({ field: "byteSize", code: "size", message: "Image size is outside the allowed range" });
  }
  if (!Number.isInteger(input.width) || !Number.isInteger(input.height) || input.width <= 0 || input.height <= 0 ||
      input.width > maxWidth || input.height > maxHeight) {
    errors.push({ field: "dimensions", code: "dimensions", message: "Image dimensions are outside the allowed range" });
  }
  const altTexts = [input.altTextPl, input.altTextEn].filter((value): value is string => Boolean(value?.trim()));
  if (altTexts.length === 0) {
    errors.push({ field: "altText", code: "alt-text", message: "At least one localized alt text is required" });
  } else if (altTexts.some((value) => value.trim().length > maxAltLength)) {
    errors.push({ field: "altText", code: "alt-text", message: "Alt text is too long" });
  }
  return errors;
}
