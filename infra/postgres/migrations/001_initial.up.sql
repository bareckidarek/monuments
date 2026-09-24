CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE monument (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_namespace text NOT NULL,
  external_id text NOT NULL,
  slug text NOT NULL UNIQUE,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  region text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT monument_external_id_unique UNIQUE (source_namespace, external_id),
  CONSTRAINT monument_latitude_range CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CONSTRAINT monument_longitude_range CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE TABLE monument_translation (
  monument_id uuid NOT NULL REFERENCES monument(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('pl', 'en')),
  name text NOT NULL,
  description text,
  address text,
  region_label text,
  seo_title text,
  seo_description text,
  PRIMARY KEY (monument_id, locale)
);

CREATE TABLE monument_image (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monument_id uuid NOT NULL REFERENCES monument(id) ON DELETE CASCADE,
  storage_key text NOT NULL UNIQUE,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size > 0),
  width integer CHECK (width IS NULL OR width > 0),
  height integer CHECK (height IS NULL OR height > 0),
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  alt_text_pl text,
  alt_text_en text,
  caption_pl text,
  caption_en text,
  provenance text,
  license text,
  processing_status text NOT NULL DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'processing', 'ready', 'failed'))
);

CREATE TABLE import_batch (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  input_version text NOT NULL,
  source_namespace text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  total_count integer NOT NULL DEFAULT 0 CHECK (total_count >= 0),
  imported_count integer NOT NULL DEFAULT 0 CHECK (imported_count >= 0),
  skipped_count integer NOT NULL DEFAULT 0 CHECK (skipped_count >= 0),
  error_count integer NOT NULL DEFAULT 0 CHECK (error_count >= 0),
  checksum text NOT NULL,
  report_location text
);

CREATE TABLE import_record (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES import_batch(id) ON DELETE CASCADE,
  source_record_hash text NOT NULL,
  external_id text NOT NULL,
  validation_status text NOT NULL CHECK (validation_status IN ('valid', 'invalid', 'skipped')),
  error_codes text[] NOT NULL DEFAULT '{}',
  transformed_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  checkpoint_state text NOT NULL DEFAULT 'pending'
    CHECK (checkpoint_state IN ('pending', 'applied', 'failed', 'skipped')),
  idempotency_outcome text
    CHECK (idempotency_outcome IS NULL OR idempotency_outcome IN ('inserted', 'updated', 'unchanged', 'conflict')),
  UNIQUE (batch_id, source_record_hash)
);

CREATE INDEX monument_published_slug_idx ON monument (slug) WHERE is_published;
CREATE INDEX monument_coordinates_idx ON monument (latitude, longitude)
  WHERE is_published AND latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX import_record_batch_checkpoint_idx ON import_record (batch_id, checkpoint_state);
