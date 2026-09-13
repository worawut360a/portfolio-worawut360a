import type { MediaSource } from './media'

export interface Profile {
  id: number; full_name: string; nickname: string; position: string
  academic_standing: string; subject_group: string; school: string
  affiliation: string; area_office: string; email: string; phone: string
  facebook: string; line_id: string
  avatar_source: MediaSource | null; avatar_ref: string | null
  avatar_focus_x: number; avatar_focus_y: number
  motto: string; philosophy: string; bio: string | null
  experience_years: number; teaching_hours: number
}

export interface Domain {
  id: number; code: number; name: string; description: string; color: string; icon: string
}

export interface Indicator {
  id: number; domain_id: number; code: string; name: string
  description: string; sort_order: number
  domain_code?: number; domain_name?: string
}

export interface Work {
  id: number; indicator_id: number; title: string; slug: string
  summary: string; content: string | null
  academic_year: number; semester: number; work_date: string | null
  cover_source: MediaSource | null; cover_ref: string | null
  video_url: string; tags: string; view_count: number
  is_featured: number; status: string
  indicator_code?: string; indicator_name?: string; domain_code?: number
}

export interface WorkImage {
  id: number; work_id: number; source: MediaSource; ref: string
  caption: string; width: number; height: number; sort_order: number
}

export interface WorkFile {
  id: number; work_id: number; source: MediaSource; ref: string
  original_name: string; mime_type: string; size_bytes: number
}

export interface Agreement {
  id: number; fiscal_year: number; round: number
  period_start: string | null; period_end: string | null
  position: string; academic_standing: string; school: string
  affiliation: string; subject_group: string
  teaching_hours: number; support_hours: number; status: string
  evaluation_score: number | null; evaluation_result: string | null
  pdf_source: MediaSource | null; pdf_ref: string | null; pdf_name: string | null
  note: string
  updated_at?: string
}

export interface PaDetail {
  id: number; agreement_id: number; indicator_id: number
  task_description: string; expected_quantity: string; expected_quality: string
  sort_order: number
  indicator_code?: string; indicator_name?: string; domain_code?: number
}

export interface PaChallenge {
  id: number; agreement_id: number; topic: string
  problem_statement: string; method: string; expected_outcome: string
}

export interface SelfDev {
  id: number; title: string; organizer: string; type: string
  start_date: string | null; end_date: string | null
  hours: number; fiscal_year: number
  certificate_source: MediaSource | null; certificate_ref: string | null
  note: string; summary: string; content: string | null
  video_url: string; link_url: string; link_label: string
}

export interface Award {
  id: number; title: string; awarder: string; level: string
  award_date: string | null
  image_source: MediaSource | null; image_ref: string | null
  note: string; summary: string; content: string | null
  video_url: string; link_url: string; link_label: string
}

export interface ItemImage {
  id: number; entity_type: string; entity_id: number
  source: MediaSource; ref: string; caption: string
  width: number; height: number; sort_order: number
}

export interface ItemFile {
  id: number; entity_type: string; entity_id: number
  source: MediaSource; ref: string; original_name: string
  mime_type: string; size_bytes: number
}

export interface Education { id: number; year_th: number; degree: string; institute: string; sort_order: number }
export interface CareerPath { id: number; period: string; position: string; school: string; is_current: number; sort_order: number }
