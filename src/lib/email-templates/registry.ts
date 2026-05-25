import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

// No transactional templates are currently registered. Re-add entries here
// when introducing future transactional emails.
export const TEMPLATES: Record<string, TemplateEntry> = {}
