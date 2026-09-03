/**
 * Type definitions for SendWiseWorkplace Console.
 *
 * See docs/PLAN.md for the 11-category taxonomy and routing table.
 */

export type SeverityLevel = 'high' | 'medium' | 'low';

// 11-category workplace taxonomy (docs/PLAN.md).
export type IncidentCategory =
  | 'sexual_harassment'
  | 'hate_speech_caste_religion'
  | 'hate_speech_gender_lgbtq'
  | 'hate_speech_disability'
  | 'hate_speech_race'
  | 'threats_intimidation'
  | 'harassment_general'
  | 'bullying_persistent'
  | 'power_abuse'
  | 'self_harm'
  | 'psychological_safety_erosion';

export type Platform =
  | 'slack'
  | 'teams'
  | 'gmail'
  | 'outlook'
  | 'google_chat'
  | 'other';

export type ActionTaken =
  | 'detected'
  | 'edited'
  | 'sent_anyway'
  | 'cancelled';

// Where an incident is routed for review. See PLAN.md routing table.
export type RouteTarget = 'posh_ic' | 'hr' | 'eap' | 'legal' | 'security';

// Console user roles.
export type Role =
  | 'employee'
  | 'hr_partner'
  | 'hr_head'
  | 'posh_ic_member'
  | 'posh_ic_chair'
  | 'eap'
  | 'legal';

export type IncidentStatus = 'open' | 'in_review' | 'closed';

/**
 * Server-side incident row (mirrors `incidents` table in migration 004).
 * Privacy: message content is analysed on-device and never persisted here.
 */
export interface Incident {
  id: string;
  employee_id_hash: string;
  timestamp: string;
  category: IncidentCategory;
  severity: SeverityLevel;
  action: ActionTaken;
  platform: Platform;
  session_id: string;
  assigned_to_role: RouteTarget;
  sla_deadline: string;
  status: IncidentStatus;
  created_at: string;
}

export interface Employee {
  id: string;
  display_name: string;
}
