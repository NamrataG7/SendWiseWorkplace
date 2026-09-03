/**
 * Zod schemas for API request validation.
 *
 * Privacy rule: violation ingest MUST NEVER include message content.
 * The API route additionally rejects any payload containing `text`,
 * `message`, or `content` fields as a defense-in-depth guard.
 */

import { z } from 'zod';

// Mirrors IncidentCategory in lib/types.ts (11 workplace categories, PLAN.md).
export const IncidentCategoryEnum = z.enum([
  'sexual_harassment',
  'hate_speech_caste_religion',
  'hate_speech_gender_lgbtq',
  'hate_speech_disability',
  'hate_speech_race',
  'threats_intimidation',
  'harassment_general',
  'bullying_persistent',
  'power_abuse',
  'self_harm',
  'psychological_safety_erosion',
]);
export type IncidentCategoryT = z.infer<typeof IncidentCategoryEnum>;

export const SeverityEnum = z.enum(['low', 'medium', 'high']);
export type SeverityT = z.infer<typeof SeverityEnum>;

export const ActionEnum = z.enum(['detected', 'edited', 'sent_anyway', 'cancelled']);
export type ActionT = z.infer<typeof ActionEnum>;

export const PlatformEnum = z.enum([
  'slack',
  'teams',
  'gmail',
  'outlook',
  'google_chat',
  'other',
]);
export type PlatformT = z.infer<typeof PlatformEnum>;

const HEX64 = /^[a-f0-9]{64}$/i;

// The extension posts this shape. `user_id_hash` (from extension MVP) is
// accepted as an alias for the server-side `employee_id_hash`.
export const ViolationIngestSchema = z
  .object({
    user_id_hash: z
      .string()
      .regex(HEX64, 'user_id_hash must be 64 hex characters (SHA-256)'),
    timestamp: z
      .string()
      .refine((s) => !Number.isNaN(Date.parse(s)), 'timestamp must be ISO 8601'),
    category: IncidentCategoryEnum,
    severity: SeverityEnum,
    action: ActionEnum,
    session_id: z.string().min(1),
    platform: PlatformEnum.default('other'),
  })
  .strict();

export type ViolationIngest = z.infer<typeof ViolationIngestSchema>;

/**
 * Fields that must never appear in a violation ingest payload.
 * Enforced by the route handler before schema validation.
 */
export const FORBIDDEN_CONTENT_FIELDS = ['text', 'message', 'content'] as const;
