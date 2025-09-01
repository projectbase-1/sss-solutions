export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          absent_days: number | null
          branch_id: string | null
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          date: string
          deduction: number | null
          employee_id: string
          food: number | null
          id: string
          late_days: number | null
          month: string | null
          notes: string | null
          ot_hours: number | null
          present_days: number | null
          status: string
          uniform: number | null
        }
        Insert: {
          absent_days?: number | null
          branch_id?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date: string
          deduction?: number | null
          employee_id: string
          food?: number | null
          id?: string
          late_days?: number | null
          month?: string | null
          notes?: string | null
          ot_hours?: number | null
          present_days?: number | null
          status: string
          uniform?: number | null
        }
        Update: {
          absent_days?: number | null
          branch_id?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date?: string
          deduction?: number | null
          employee_id?: string
          food?: number | null
          id?: string
          late_days?: number | null
          month?: string | null
          notes?: string | null
          ot_hours?: number | null
          present_days?: number | null
          status?: string
          uniform?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string
          created_at: string
          departments: Json | null
          driver_enabled: boolean | null
          driver_rate: number | null
          email: string
          employee_count: number | null
          id: string
          manager: string
          name: string
          ot_rate: number
          phone: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          created_at?: string
          departments?: Json | null
          driver_enabled?: boolean | null
          driver_rate?: number | null
          email: string
          employee_count?: number | null
          id?: string
          manager: string
          name: string
          ot_rate?: number
          phone: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          departments?: Json | null
          driver_enabled?: boolean | null
          driver_rate?: number | null
          email?: string
          employee_count?: number | null
          id?: string
          manager?: string
          name?: string
          ot_rate?: number
          phone?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      employee_documents: {
        Row: {
          created_at: string | null
          document_name: string
          document_type: string | null
          employee_id: string
          file_url: string
          id: string
          uploaded_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_name: string
          document_type?: string | null
          employee_id: string
          file_url: string
          id?: string
          uploaded_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_name?: string
          document_type?: string | null
          employee_id?: string
          file_url?: string
          id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          aadhar_card: string | null
          account_number: string | null
          advance: number | null
          allowances: number
          avatar_url: string | null
          bank_name: string | null
          basic_salary: number
          basic_salary_percentage: number | null
          branch_id: string | null
          branch_name: string | null
          contract_name: string | null
          conveyance: number | null
          created_at: string
          da_amount: number | null
          da_percentage: number | null
          da_rate: number | null
          date_of_birth: string | null
          day_rate: number | null
          days: number | null
          department: string
          document_url: string | null
          email: string
          employee_id: string
          esi_eligible: boolean | null
          esi_number: string | null
          fathers_name: string | null
          gross_salary: number | null
          hra: number
          id: string
          ifsc_code: string | null
          is_driver: boolean | null
          join_date: string
          late_deduction_eligible: boolean | null
          location: string | null
          mode_of_payment: string | null
          name: string
          notes: string | null
          ot_amount: number | null
          other_allowances: number | null
          overtime_eligible: boolean | null
          pan_card: string | null
          per_day_salary: number | null
          pf: number | null
          pf_eligible: boolean | null
          pf_number: string | null
          phone: string | null
          position: string
          rent_deduction: number | null
          row_number: number | null
          shift_code: string | null
          shoe_uniform_allowance: number | null
          status: string
          tea_allowance: number | null
          transfer_mode: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          aadhar_card?: string | null
          account_number?: string | null
          advance?: number | null
          allowances?: number
          avatar_url?: string | null
          bank_name?: string | null
          basic_salary?: number
          basic_salary_percentage?: number | null
          branch_id?: string | null
          branch_name?: string | null
          contract_name?: string | null
          conveyance?: number | null
          created_at?: string
          da_amount?: number | null
          da_percentage?: number | null
          da_rate?: number | null
          date_of_birth?: string | null
          day_rate?: number | null
          days?: number | null
          department: string
          document_url?: string | null
          email: string
          employee_id: string
          esi_eligible?: boolean | null
          esi_number?: string | null
          fathers_name?: string | null
          gross_salary?: number | null
          hra?: number
          id?: string
          ifsc_code?: string | null
          is_driver?: boolean | null
          join_date?: string
          late_deduction_eligible?: boolean | null
          location?: string | null
          mode_of_payment?: string | null
          name: string
          notes?: string | null
          ot_amount?: number | null
          other_allowances?: number | null
          overtime_eligible?: boolean | null
          pan_card?: string | null
          per_day_salary?: number | null
          pf?: number | null
          pf_eligible?: boolean | null
          pf_number?: string | null
          phone?: string | null
          position: string
          rent_deduction?: number | null
          row_number?: number | null
          shift_code?: string | null
          shoe_uniform_allowance?: number | null
          status?: string
          tea_allowance?: number | null
          transfer_mode?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          aadhar_card?: string | null
          account_number?: string | null
          advance?: number | null
          allowances?: number
          avatar_url?: string | null
          bank_name?: string | null
          basic_salary?: number
          basic_salary_percentage?: number | null
          branch_id?: string | null
          branch_name?: string | null
          contract_name?: string | null
          conveyance?: number | null
          created_at?: string
          da_amount?: number | null
          da_percentage?: number | null
          da_rate?: number | null
          date_of_birth?: string | null
          day_rate?: number | null
          days?: number | null
          department?: string
          document_url?: string | null
          email?: string
          employee_id?: string
          esi_eligible?: boolean | null
          esi_number?: string | null
          fathers_name?: string | null
          gross_salary?: number | null
          hra?: number
          id?: string
          ifsc_code?: string | null
          is_driver?: boolean | null
          join_date?: string
          late_deduction_eligible?: boolean | null
          location?: string | null
          mode_of_payment?: string | null
          name?: string
          notes?: string | null
          ot_amount?: number | null
          other_allowances?: number | null
          overtime_eligible?: boolean | null
          pan_card?: string | null
          per_day_salary?: number | null
          pf?: number | null
          pf_eligible?: boolean | null
          pf_number?: string | null
          phone?: string | null
          position?: string
          rent_deduction?: number | null
          row_number?: number | null
          shift_code?: string | null
          shoe_uniform_allowance?: number | null
          status?: string
          tea_allowance?: number | null
          transfer_mode?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      general_settings: {
        Row: {
          company_address: string | null
          company_email: string | null
          company_name: string | null
          created_at: string
          currency: string | null
          date_format: string | null
          id: string
          language: string | null
          pdf_format: string | null
          phone: string | null
          sidebar_mode: string | null
          theme: string | null
          time_format: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          created_at?: string
          currency?: string | null
          date_format?: string | null
          id?: string
          language?: string | null
          pdf_format?: string | null
          phone?: string | null
          sidebar_mode?: string | null
          theme?: string | null
          time_format?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          created_at?: string
          currency?: string | null
          date_format?: string | null
          id?: string
          language?: string | null
          pdf_format?: string | null
          phone?: string | null
          sidebar_mode?: string | null
          theme?: string | null
          time_format?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          description: string | null
          employee_id: string
          id: string
          progress: number
          status: string
          target_date: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          employee_id: string
          id?: string
          progress?: number
          status?: string
          target_date: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          employee_id?: string
          id?: string
          progress?: number
          status?: string
          target_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          application_id: string
          created_at: string
          id: string
          interview_date: string
          interview_time: string
          interview_type: string
          interviewer_id: string
          notes: string | null
          score: number | null
          status: string
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          interview_date: string
          interview_time: string
          interview_type: string
          interviewer_id: string
          notes?: string | null
          score?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          interview_date?: string
          interview_time?: string
          interview_type?: string
          interviewer_id?: string
          notes?: string | null
          score?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applied_at: string
          candidate_email: string
          candidate_name: string
          candidate_phone: string | null
          cover_letter: string | null
          experience_years: number
          id: string
          job_posting_id: string
          resume_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          applied_at?: string
          candidate_email: string
          candidate_name: string
          candidate_phone?: string | null
          cover_letter?: string | null
          experience_years?: number
          id?: string
          job_posting_id: string
          resume_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          applied_at?: string
          candidate_email?: string
          candidate_name?: string
          candidate_phone?: string | null
          cover_letter?: string | null
          experience_years?: number
          id?: string
          job_posting_id?: string
          resume_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          application_deadline: string | null
          created_at: string
          department: string
          description: string | null
          id: string
          job_type: string
          location: string
          posted_date: string
          requirements: string | null
          status: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          application_deadline?: string | null
          created_at?: string
          department: string
          description?: string | null
          id?: string
          job_type: string
          location: string
          posted_date?: string
          requirements?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          application_deadline?: string | null
          created_at?: string
          department?: string
          description?: string | null
          id?: string
          job_type?: string
          location?: string
          posted_date?: string
          requirements?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          days_count: number
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          days_count: number
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          days_count?: number
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string
          email_notifications: boolean | null
          id: string
          push_notifications: boolean | null
          sms_notifications: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payroll: {
        Row: {
          allowances: number
          basic_plus_da: number | null
          basic_salary: number
          created_at: string
          da_amount: number | null
          day_salary: number | null
          deductions: number
          employee_id: string
          esi_0_75_percent: number | null
          esi_number: string | null
          extra_hours_pay: number | null
          food: number | null
          gross_earnings: number | null
          gross_pay: number
          hra: number
          id: string
          lunch: number | null
          man_days_details: Json | null
          month: string | null
          net_pay: number
          ot_amount: number | null
          ot_hours: number | null
          ot_rate: number | null
          pay_period_end: string
          pay_period_start: string
          pf_12_percent: number | null
          pf_number: string | null
          processed_at: string | null
          rent_deduction: number | null
          salary_components: Json | null
          shoe_uniform_allowance: number | null
          status: string
          take_home: number | null
          uniform: number | null
          updated_at: string
          worked_days: number | null
        }
        Insert: {
          allowances?: number
          basic_plus_da?: number | null
          basic_salary?: number
          created_at?: string
          da_amount?: number | null
          day_salary?: number | null
          deductions?: number
          employee_id: string
          esi_0_75_percent?: number | null
          esi_number?: string | null
          extra_hours_pay?: number | null
          food?: number | null
          gross_earnings?: number | null
          gross_pay?: number
          hra?: number
          id?: string
          lunch?: number | null
          man_days_details?: Json | null
          month?: string | null
          net_pay?: number
          ot_amount?: number | null
          ot_hours?: number | null
          ot_rate?: number | null
          pay_period_end: string
          pay_period_start: string
          pf_12_percent?: number | null
          pf_number?: string | null
          processed_at?: string | null
          rent_deduction?: number | null
          salary_components?: Json | null
          shoe_uniform_allowance?: number | null
          status?: string
          take_home?: number | null
          uniform?: number | null
          updated_at?: string
          worked_days?: number | null
        }
        Update: {
          allowances?: number
          basic_plus_da?: number | null
          basic_salary?: number
          created_at?: string
          da_amount?: number | null
          day_salary?: number | null
          deductions?: number
          employee_id?: string
          esi_0_75_percent?: number | null
          esi_number?: string | null
          extra_hours_pay?: number | null
          food?: number | null
          gross_earnings?: number | null
          gross_pay?: number
          hra?: number
          id?: string
          lunch?: number | null
          man_days_details?: Json | null
          month?: string | null
          net_pay?: number
          ot_amount?: number | null
          ot_hours?: number | null
          ot_rate?: number | null
          pay_period_end?: string
          pay_period_start?: string
          pf_12_percent?: number | null
          pf_number?: string | null
          processed_at?: string | null
          rent_deduction?: number | null
          salary_components?: Json | null
          shoe_uniform_allowance?: number | null
          status?: string
          take_home?: number | null
          uniform?: number | null
          updated_at?: string
          worked_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_settings: {
        Row: {
          created_at: string
          esi_rate: number
          id: string
          income_tax_rate: number
          monthly_pay_date: number
          overtime_rate: number
          pay_frequency: string
          pf_rate: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          esi_rate?: number
          id?: string
          income_tax_rate?: number
          monthly_pay_date?: number
          overtime_rate?: number
          pay_frequency?: string
          pf_rate?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          esi_rate?: number
          id?: string
          income_tax_rate?: number
          monthly_pay_date?: number
          overtime_rate?: number
          pay_frequency?: string
          pf_rate?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      performance_reviews: {
        Row: {
          areas_for_improvement: string | null
          created_at: string
          employee_id: string
          goals_progress: Json | null
          id: string
          month: string | null
          overall_score: number
          review_date: string
          review_period: string
          reviewer_id: string
          status: string
          strengths: string | null
          updated_at: string
        }
        Insert: {
          areas_for_improvement?: string | null
          created_at?: string
          employee_id: string
          goals_progress?: Json | null
          id?: string
          month?: string | null
          overall_score: number
          review_date?: string
          review_period: string
          reviewer_id: string
          status?: string
          strengths?: string | null
          updated_at?: string
        }
        Update: {
          areas_for_improvement?: string | null
          created_at?: string
          employee_id?: string
          goals_progress?: Json | null
          id?: string
          month?: string | null
          overall_score?: number
          review_date?: string
          review_period?: string
          reviewer_id?: string
          status?: string
          strengths?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      security_settings: {
        Row: {
          created_at: string
          id: string
          password_policy_enabled: boolean | null
          totp_confirmed: boolean
          totp_secret: string | null
          two_factor_backup_codes: string[] | null
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          two_factor_verified: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_policy_enabled?: boolean | null
          totp_confirmed?: boolean
          totp_secret?: string | null
          two_factor_backup_codes?: string[] | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          two_factor_verified?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          password_policy_enabled?: boolean | null
          totp_confirmed?: boolean
          totp_secret?: string | null
          two_factor_backup_codes?: string[] | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          two_factor_verified?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_datasets: {
        Row: {
          created_at: string
          id: string
          master_user_id: string
          shared_with_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          master_user_id: string
          shared_with_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          master_user_id?: string
          shared_with_user_id?: string
        }
        Relationships: []
      }
      user_totp: {
        Row: {
          backup_codes: string[] | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          is_verified: boolean | null
          secret: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          is_verified?: boolean | null
          secret: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          is_verified?: boolean | null
          secret?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_effective_user_id: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_master_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_employee_ids: {
        Args: { user_uuid: string }
        Returns: string[]
      }
      get_user_job_application_ids: {
        Args: { user_uuid: string }
        Returns: string[]
      }
      get_user_job_posting_ids: {
        Args: { user_uuid: string }
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
