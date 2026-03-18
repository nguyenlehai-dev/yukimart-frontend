/**
 * Global shared types mapped from backend Enums or Constants
 */

export type UserRole = 'admin' | 'manager' | 'employee'

export type Status = 'active' | 'inactive' | 'pending' | 'deleted'

export interface BaseEntity {
  id: number | string
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}
