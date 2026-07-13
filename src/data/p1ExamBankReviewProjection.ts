import projectionJson from './p1ExamBankReviewProjection.json';

export type P1ExamBankDisposition = 'hold' | 'promote' | 'reject';
export type P1ExamBankReviewStatus = 'pending' | 'reviewed' | 'rejected';

export interface P1ExamBankReviewRecord {
  identity: {
    course_id: 'p1';
    paper_family: 'p1';
    question_id: string;
    paper: string;
    question_number: string;
  };
  source: {
    source_repo_name: string;
    source_repo_head: string;
    manifest_path: string;
    manifest_sha256: string;
    manifest_projection_fingerprint: string;
    topic_id: string;
    topic_label: string;
    canonical_topic_id: string;
    packet_section: 'approved' | 'review_required';
    source_label: string;
    source_paper_code: string;
    source_review_status_marker: string | null;
    source_review_decision_action: string | null;
    source_review_reasons: string[];
    source_warnings: string[];
    question_image_paths: string[];
    mark_scheme_image_paths: string[];
    question_assets: Array<{ path: string; sha256: string }>;
    mark_scheme_assets: Array<{ path: string; sha256: string }>;
    answer_available: boolean;
    marks: number | null;
  };
  review: {
    disposition: P1ExamBankDisposition;
    review_status: P1ExamBankReviewStatus;
    student_runtime_safe: boolean;
    reviewed_topic_id: string | null;
    reviewed_skill_ids: string[];
    reviewer: string | null;
    reviewed_at: string | null;
    notes: string | null;
  };
}

export interface P1ExamBankReviewProjection {
  schema_name: 'asterion.course_topic_packet_review_projection';
  schema_version: 1;
  projection_version: string;
  course_id: 'p1';
  paper_family: 'p1';
  source: {
    repo_name: string;
    repo_head: string;
    topic_packet_root: string;
    taxonomy_path: string;
    read_only: true;
  };
  policy: {
    source_packet_approval_is_not_asterion_review: true;
    default_disposition: 'hold';
    promotion_requires: string[];
    difficulty_metadata_drives_promotion: false;
  };
  totals: {
    records: number;
    source_packet_approved: number;
    source_packet_review_required: number;
    asterion_reviewed: number;
    student_runtime_safe: number;
    promotion_ready: number;
  };
  topics: Array<{
    official_section_code: string;
    topic_id: string;
    topic_label: string;
    canonical_topic_id: string;
    manifest: {
      path: string;
      sha256: string;
      schema_name: string;
      schema_version: number;
      generated_at: string;
      projection_fingerprint: string;
    };
    counts: {
      total: number;
      source_packet_approved: number;
      source_packet_review_required: number;
      missing_answer: number;
    };
  }>;
  records: P1ExamBankReviewRecord[];
}

export const P1_EXAM_BANK_REVIEW_PROJECTION = projectionJson as P1ExamBankReviewProjection;

export function isP1ExamBankPromotionReady(record: P1ExamBankReviewRecord): boolean {
  return record.review.disposition === 'promote'
    && record.review.review_status === 'reviewed'
    && record.review.student_runtime_safe === true;
}
