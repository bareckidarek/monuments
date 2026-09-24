import type { Locale } from "../i18n/locale";

export type GalleryImage = {
  id: string;
  url: string;
  altTextPl?: string | null;
  altTextEn?: string | null;
  captionPl?: string | null;
  captionEn?: string | null;
};

export function localizedImageText(image: GalleryImage, locale: Locale): { alt: string; caption?: string } {
  const alt = (locale === "en" ? image.altTextEn : image.altTextPl) ??
    image.altTextPl ??
    image.altTextEn ??
    "Monument image";
  const caption = (locale === "en" ? image.captionEn : image.captionPl) ??
    image.captionPl ??
    image.captionEn ??
    undefined;
  return { alt, caption };
}

export function AccessibleGallery({ images, locale }: { images: GalleryImage[]; locale: Locale }) {
  if (images.length === 0) return null;
  return (
    <section aria-label={locale === "en" ? "Image gallery" : "Galeria zdjęć"}>
      <ul>
        {images.map((image) => {
          const text = localizedImageText(image, locale);
          return (
            <li key={image.id}>
              <figure>
                <img src={image.url} alt={text.alt} loading="lazy" />
                {text.caption && <figcaption>{text.caption}</figcaption>}
              </figure>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
