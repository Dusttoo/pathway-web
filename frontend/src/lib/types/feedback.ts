/**
 * Feedback submission types
 */

export type FeedbackType = "bug" | "feature" | "feedback";

export type FeedbackStatus =
  | "new"
  | "triaged"
  | "in_progress"
  | "completed"
  | "archived";

export type FeedbackPriority = "low" | "medium" | "high" | "critical";

export interface FeedbackAttachment {
  filename: string;
  s3_key: string;
  url: string;
  size: number;
  content_type: string;
}

export interface FeedbackSubmission {
  id: string;
  type: FeedbackType;
  title: string;
  description: string;
  user_id: string;
  discord_guild_id: string | null;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  github_issue_url: string | null;
  github_issue_number: number | null;
  ticket_number: string;
  metadata: Record<string, any>;
  attachments: FeedbackAttachment[];
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  user_username: string | null;
  user_display_name: string | null;
  comment_count: number;
}

export interface FeedbackComment {
  id: string;
  feedback_id: string;
  user_id: string;
  user_username: string | null;
  user_display_name: string | null;
  comment: string;
  is_internal: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export interface FeedbackSubmissionCreate {
  type: FeedbackType;
  title: string;
  description: string;
  discord_guild_id?: string | null;
  metadata?: Record<string, any>;
  attachments?: FeedbackAttachment[];
}

export interface FeedbackCommentCreate {
  comment: string;
}
