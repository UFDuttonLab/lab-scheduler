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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_type: Database["public"]["Enums"]["action_type"]
          changes: Json | null
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action_type: Database["public"]["Enums"]["action_type"]
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action_type?: Database["public"]["Enums"]["action_type"]
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_versions: {
        Row: {
          changes: Json
          created_at: string
          id: string
          released_at: string
          released_by: string | null
          version: string
        }
        Insert: {
          changes?: Json
          created_at?: string
          id?: string
          released_at?: string
          released_by?: string | null
          version: string
        }
        Update: {
          changes?: Json
          created_at?: string
          id?: string
          released_at?: string
          released_by?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_versions_released_by_fkey"
            columns: ["released_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_helpers: {
        Row: {
          booking_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_helpers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_helpers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_group_id: string | null
          collaborators: Json | null
          cpu_count: number | null
          created_at: string
          end_time: string
          equipment_id: string
          gpu_count: number | null
          helpers_note: string | null
          helpers_wanted: boolean
          id: string
          project_id: string | null
          project_samples: Json | null
          purpose: string | null
          samples_processed: number | null
          start_time: string
          status: string
          user_id: string
        }
        Insert: {
          booking_group_id?: string | null
          collaborators?: Json | null
          cpu_count?: number | null
          created_at?: string
          end_time: string
          equipment_id: string
          gpu_count?: number | null
          helpers_note?: string | null
          helpers_wanted?: boolean
          id?: string
          project_id?: string | null
          project_samples?: Json | null
          purpose?: string | null
          samples_processed?: number | null
          start_time: string
          status?: string
          user_id: string
        }
        Update: {
          booking_group_id?: string | null
          collaborators?: Json | null
          cpu_count?: number | null
          created_at?: string
          end_time?: string
          equipment_id?: string
          gpu_count?: number | null
          helpers_note?: string | null
          helpers_wanted?: boolean
          id?: string
          project_id?: string | null
          project_samples?: Json | null
          purpose?: string | null
          samples_processed?: number | null
          start_time?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_feed_settings: {
        Row: {
          enabled: boolean
          feed_key: string
          id: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          enabled?: boolean
          feed_key: string
          id?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          enabled?: boolean
          feed_key?: string
          id?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      equipment: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          location: string
          max_cpu_count: number | null
          max_gpu_count: number | null
          name: string
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          location: string
          max_cpu_count?: number | null
          max_gpu_count?: number | null
          name: string
          status?: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          location?: string
          max_cpu_count?: number | null
          max_gpu_count?: number | null
          name?: string
          status?: string
          type?: string
        }
        Relationships: []
      }
      equipment_projects: {
        Row: {
          equipment_id: string
          project_id: string
        }
        Insert: {
          equipment_id: string
          project_id: string
        }
        Update: {
          equipment_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_projects_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      game_scores: {
        Row: {
          accuracy_percentage: number
          combo_max: number
          created_at: string
          game_duration_seconds: number
          game_type: string
          id: string
          microbes_eliminated: number
          score: number
          user_id: string
        }
        Insert: {
          accuracy_percentage?: number
          combo_max?: number
          created_at?: string
          game_duration_seconds?: number
          game_type?: string
          id?: string
          microbes_eliminated?: number
          score?: number
          user_id: string
        }
        Update: {
          accuracy_percentage?: number
          combo_max?: number
          created_at?: string
          game_duration_seconds?: number
          game_type?: string
          id?: string
          microbes_eliminated?: number
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string
          full_name: string | null
          id: string
          spirit_animal: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          spirit_animal?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          spirit_animal?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      recruiting_application_positions: {
        Row: {
          application_id: string
          created_at: string
          position_id: string
          rank: number
        }
        Insert: {
          application_id: string
          created_at?: string
          position_id: string
          rank: number
        }
        Update: {
          application_id?: string
          created_at?: string
          position_id?: string
          rank?: number
        }
        Relationships: [
          {
            foreignKeyName: "recruiting_application_positions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "recruiting_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_application_positions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "recruiting_open_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_application_positions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "recruiting_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiting_applications: {
        Row: {
          animal_samples_ok: boolean
          availability: Json
          conflicts: string | null
          coursework: string[]
          created_at: string
          credit_type: string
          cycle: string
          email: string
          expected_graduation: string
          field_intl_interest: boolean
          field_local_ok: boolean
          full_name: string
          has_transportation: boolean
          hours_available: number
          id: string
          longest_block_hours: number
          major: string
          policy_check_score: number
          prior_contact: string | null
          prior_lab_experience: string | null
          profile_id: string | null
          r_experience: string
          semesters_available: number
          statement: string
          status: string
          updated_at: string
          year: string
        }
        Insert: {
          animal_samples_ok: boolean
          availability: Json
          conflicts?: string | null
          coursework: string[]
          created_at?: string
          credit_type: string
          cycle: string
          email: string
          expected_graduation: string
          field_intl_interest: boolean
          field_local_ok: boolean
          full_name: string
          has_transportation: boolean
          hours_available: number
          id?: string
          longest_block_hours: number
          major: string
          policy_check_score: number
          prior_contact?: string | null
          prior_lab_experience?: string | null
          profile_id?: string | null
          r_experience: string
          semesters_available: number
          statement: string
          status?: string
          updated_at?: string
          year: string
        }
        Update: {
          animal_samples_ok?: boolean
          availability?: Json
          conflicts?: string | null
          coursework?: string[]
          created_at?: string
          credit_type?: string
          cycle?: string
          email?: string
          expected_graduation?: string
          field_intl_interest?: boolean
          field_local_ok?: boolean
          full_name?: string
          has_transportation?: boolean
          hours_available?: number
          id?: string
          longest_block_hours?: number
          major?: string
          policy_check_score?: number
          prior_contact?: string | null
          prior_lab_experience?: string | null
          profile_id?: string | null
          r_experience?: string
          semesters_available?: number
          statement?: string
          status?: string
          updated_at?: string
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiting_applications_cycle_fkey"
            columns: ["cycle"]
            isOneToOne: false
            referencedRelation: "recruiting_cycles"
            referencedColumns: ["cycle"]
          },
          {
            foreignKeyName: "recruiting_applications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiting_cycles: {
        Row: {
          active: boolean
          closes_at: string
          created_at: string
          cycle: string
          intro_md: string | null
          label: string
          max_submissions_per_hour: number
          min_hours_per_week: number
          min_semesters: number
          next_cycle_note: string | null
          opens_at: string
          pi_contact_email: string
          pow_difficulty_bits: number
          require_turnstile: boolean
          trial_weeks: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          closes_at: string
          created_at?: string
          cycle: string
          intro_md?: string | null
          label: string
          max_submissions_per_hour?: number
          min_hours_per_week?: number
          min_semesters?: number
          next_cycle_note?: string | null
          opens_at: string
          pi_contact_email: string
          pow_difficulty_bits?: number
          require_turnstile?: boolean
          trial_weeks?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          closes_at?: string
          created_at?: string
          cycle?: string
          intro_md?: string | null
          label?: string
          max_submissions_per_hour?: number
          min_hours_per_week?: number
          min_semesters?: number
          next_cycle_note?: string | null
          opens_at?: string
          pi_contact_email?: string
          pow_difficulty_bits?: number
          require_turnstile?: boolean
          trial_weeks?: number
          updated_at?: string
        }
        Relationships: []
      }
      recruiting_positions: {
        Row: {
          created_at: string
          cycle: string
          description: string
          hours_per_week: number
          id: string
          max_mentees: number
          mentor_id: string
          min_block_hours: number
          outcome: string
          project_id: string
          requirements: string[]
          semesters_needed: number
          status: string
          tasks: string[]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cycle: string
          description: string
          hours_per_week: number
          id?: string
          max_mentees?: number
          mentor_id: string
          min_block_hours?: number
          outcome: string
          project_id: string
          requirements: string[]
          semesters_needed?: number
          status?: string
          tasks: string[]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cycle?: string
          description?: string
          hours_per_week?: number
          id?: string
          max_mentees?: number
          mentor_id?: string
          min_block_hours?: number
          outcome?: string
          project_id?: string
          requirements?: string[]
          semesters_needed?: number
          status?: string
          tasks?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiting_positions_cycle_fkey"
            columns: ["cycle"]
            isOneToOne: false
            referencedRelation: "recruiting_cycles"
            referencedColumns: ["cycle"]
          },
          {
            foreignKeyName: "recruiting_positions_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_positions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiting_pow_challenges: {
        Row: {
          difficulty_bits: number
          id: string
          issued_at: string
          used_at: string | null
        }
        Insert: {
          difficulty_bits: number
          id?: string
          issued_at?: string
          used_at?: string | null
        }
        Update: {
          difficulty_bits?: number
          id?: string
          issued_at?: string
          used_at?: string | null
        }
        Relationships: []
      }
      recruiting_reviews: {
        Row: {
          application_id: string
          created_at: string
          decision: string | null
          id: string
          interview_at: string | null
          notes: string | null
          reviewer_id: string
          score: number | null
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          decision?: string | null
          id?: string
          interview_at?: string | null
          notes?: string | null
          reviewer_id: string
          score?: number | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          decision?: string | null
          id?: string
          interview_at?: string | null
          notes?: string | null
          reviewer_id?: string
          score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiting_reviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "recruiting_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_categories: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      skill_checklist_items: {
        Row: {
          created_at: string
          id: string
          is_critical: boolean
          item_text: string
          skill_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_critical?: boolean
          item_text: string
          skill_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_critical?: boolean
          item_text?: string
          skill_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "skill_checklist_items_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_equipment: {
        Row: {
          equipment_id: string
          skill_id: string
        }
        Insert: {
          equipment_id: string
          skill_id: string
        }
        Update: {
          equipment_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_equipment_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_module_settings: {
        Row: {
          allowlist_user_ids: string[]
          id: boolean
          updated_at: string
          updated_by: string | null
          visible_to_all: boolean
        }
        Insert: {
          allowlist_user_ids?: string[]
          id?: boolean
          updated_at?: string
          updated_by?: string | null
          visible_to_all?: boolean
        }
        Update: {
          allowlist_user_ids?: string[]
          id?: boolean
          updated_at?: string
          updated_by?: string | null
          visible_to_all?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "skill_module_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_prerequisites: {
        Row: {
          prereq_id: string
          skill_id: string
        }
        Insert: {
          prereq_id: string
          skill_id: string
        }
        Update: {
          prereq_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_prerequisites_prereq_id_fkey"
            columns: ["prereq_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_prerequisites_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_quiz_answers: {
        Row: {
          correct_keys: string[]
          explanation: string | null
          question_id: string
          updated_at: string
        }
        Insert: {
          correct_keys: string[]
          explanation?: string | null
          question_id: string
          updated_at?: string
        }
        Update: {
          correct_keys?: string[]
          explanation?: string | null
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "skill_quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_quiz_attempts: {
        Row: {
          answers: Json
          attempt_no: number
          id: string
          n_correct: number
          n_critical: number
          n_critical_correct: number
          n_questions: number
          pass_pct_required: number
          passed: boolean
          quiz_version: number
          score_pct: number
          skill_id: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          attempt_no: number
          id?: string
          n_correct: number
          n_critical: number
          n_critical_correct: number
          n_questions: number
          pass_pct_required: number
          passed: boolean
          quiz_version: number
          score_pct: number
          skill_id: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          attempt_no?: number
          id?: string
          n_correct?: number
          n_critical?: number
          n_critical_correct?: number
          n_questions?: number
          pass_pct_required?: number
          passed?: boolean
          quiz_version?: number
          score_pct?: number
          skill_id?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_quiz_attempts_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_quiz_questions: {
        Row: {
          active: boolean
          created_at: string
          id: string
          is_critical: boolean
          options: Json
          prompt: string
          skill_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          is_critical?: boolean
          options?: Json
          prompt: string
          skill_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          is_critical?: boolean
          options?: Json
          prompt?: string
          skill_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_quiz_questions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_signoffs: {
        Row: {
          checklist_results: Json
          comments: string | null
          created_at: string
          expires_at: string | null
          id: string
          observed_at: string
          prereqs_waived: boolean
          quiz_waived: boolean
          revoke_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          signed_by: string
          skill_id: string
          stage_granted: Database["public"]["Enums"]["skill_stage"]
          user_id: string
          waiver_reason: string | null
        }
        Insert: {
          checklist_results?: Json
          comments?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          observed_at?: string
          prereqs_waived?: boolean
          quiz_waived?: boolean
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          signed_by: string
          skill_id: string
          stage_granted: Database["public"]["Enums"]["skill_stage"]
          user_id: string
          waiver_reason?: string | null
        }
        Update: {
          checklist_results?: Json
          comments?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          observed_at?: string
          prereqs_waived?: boolean
          quiz_waived?: boolean
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          signed_by?: string
          skill_id?: string
          stage_granted?: Database["public"]["Enums"]["skill_stage"]
          user_id?: string
          waiver_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_signoffs_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_signoffs_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_signoffs_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_signoffs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_track_items: {
        Row: {
          skill_id: string
          sort_order: number
          track_id: string
        }
        Insert: {
          skill_id: string
          sort_order?: number
          track_id: string
        }
        Update: {
          skill_id?: string
          sort_order?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_track_items_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_track_items_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "skill_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_tracks: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          active: boolean
          category_id: string
          code: string
          created_at: string
          est_train_minutes: number | null
          external_ref: string | null
          id: string
          instructions_md: string | null
          instructions_version: number
          name: string
          quiz_pass_pct: number
          quiz_version: number
          reading_refs: Json
          recert_months: number | null
          requires_practical: boolean
          requires_reading: boolean
          risk_level: string
          sort_order: number
          summary: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category_id: string
          code: string
          created_at?: string
          est_train_minutes?: number | null
          external_ref?: string | null
          id?: string
          instructions_md?: string | null
          instructions_version?: number
          name: string
          quiz_pass_pct?: number
          quiz_version?: number
          reading_refs?: Json
          recert_months?: number | null
          requires_practical?: boolean
          requires_reading?: boolean
          risk_level?: string
          sort_order?: number
          summary?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category_id?: string
          code?: string
          created_at?: string
          est_train_minutes?: number | null
          external_ref?: string | null
          id?: string
          instructions_md?: string | null
          instructions_version?: number
          name?: string
          quiz_pass_pct?: number
          quiz_version?: number
          reading_refs?: Json
          recert_months?: number | null
          requires_practical?: boolean
          requires_reading?: boolean
          risk_level?: string
          sort_order?: number
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "skill_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_records: {
        Row: {
          booking_group_id: string | null
          collaborators: Json | null
          created_at: string
          end_time: string
          equipment_id: string
          id: string
          notes: string | null
          project_id: string | null
          project_samples: Json | null
          samples_processed: number | null
          start_time: string
          user_id: string
        }
        Insert: {
          booking_group_id?: string | null
          collaborators?: Json | null
          created_at?: string
          end_time: string
          equipment_id: string
          id?: string
          notes?: string | null
          project_id?: string | null
          project_samples?: Json | null
          samples_processed?: number | null
          start_time: string
          user_id: string
        }
        Update: {
          booking_group_id?: string | null
          collaborators?: Json | null
          created_at?: string
          end_time?: string
          equipment_id?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          project_samples?: Json | null
          samples_processed?: number | null
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_records_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_skills: {
        Row: {
          expires_at: string | null
          id: string
          last_signoff_id: string | null
          notes: string | null
          reading_ack_at: string | null
          reading_ack_version: number | null
          signed_off_at: string | null
          signed_off_by: string | null
          skill_id: string
          stage: Database["public"]["Enums"]["skill_stage"]
          updated_at: string
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          id?: string
          last_signoff_id?: string | null
          notes?: string | null
          reading_ack_at?: string | null
          reading_ack_version?: number | null
          signed_off_at?: string | null
          signed_off_by?: string | null
          skill_id: string
          stage?: Database["public"]["Enums"]["skill_stage"]
          updated_at?: string
          user_id: string
        }
        Update: {
          expires_at?: string | null
          id?: string
          last_signoff_id?: string | null
          notes?: string | null
          reading_ack_at?: string | null
          reading_ack_version?: number | null
          signed_off_at?: string | null
          signed_off_by?: string | null
          skill_id?: string
          stage?: Database["public"]["Enums"]["skill_stage"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_last_signoff_id_fkey"
            columns: ["last_signoff_id"]
            isOneToOne: false
            referencedRelation: "skill_signoffs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_signed_off_by_fkey"
            columns: ["signed_off_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      recruiting_open_positions: {
        Row: {
          cycle: string | null
          description: string | null
          hours_per_week: number | null
          id: string | null
          min_block_hours: number | null
          outcome: string | null
          project_blurb: string | null
          project_icon: string | null
          project_name: string | null
          requirements: string[] | null
          semesters_needed: number | null
          tasks: string[] | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruiting_positions_cycle_fkey"
            columns: ["cycle"]
            isOneToOne: false
            referencedRelation: "recruiting_cycles"
            referencedColumns: ["cycle"]
          },
        ]
      }
      skill_quiz_status: {
        Row: {
          attempts: number | null
          best_pct: number | null
          first_passed_at: string | null
          last_attempt_at: string | null
          passed: boolean | null
          passed_quiz_version: number | null
          skill_id: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_quiz_attempts_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_grant_trainer: { Args: { _signer: string }; Returns: boolean }
      can_see_skills_module: { Args: { _user: string }; Returns: boolean }
      can_sign_off_skill: {
        Args: { _signer: string; _skill_id: string }
        Returns: boolean
      }
      get_current_version: { Args: never; Returns: string }
      get_quiz_attempt_detail: { Args: { _attempt_id: string }; Returns: Json }
      grade_skill_quiz: {
        Args: { _answers: Json; _skill_id: string }
        Returns: Json
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      ics_escape: { Args: { t: string }; Returns: string }
      ics_fold: { Args: { line: string }; Returns: string }
      ics_stamp: { Args: { t: string }; Returns: string }
      is_active_user: { Args: { _user_id: string }; Returns: boolean }
      lab_calendar_ics: { Args: { key?: string }; Returns: unknown }
      recruiting_availability_is_valid: { Args: { _a: Json }; Returns: boolean }
      recruiting_can_review: {
        Args: { _application_id: string; _user_id: string }
        Returns: boolean
      }
      recruiting_issue_pow_challenge: { Args: never; Returns: Json }
      recruiting_open_cycle: { Args: never; Returns: string }
      recruiting_submit_application: {
        Args: { _payload: Json }
        Returns: string
      }
      recruiting_submit_application_public: {
        Args: { _payload: Json }
        Returns: Json
      }
      recruiting_text_array_ok: {
        Args: { _a: string[]; _max: number; _min: number }
        Returns: boolean
      }
      recruiting_verify_pow: {
        Args: { _challenge_id: string; _nonce: string }
        Returns: boolean
      }
      rotate_calendar_feed_key: { Args: never; Returns: string }
      set_user_active: {
        Args: { _active: boolean; _actor: string; _target: string }
        Returns: undefined
      }
      set_user_role: {
        Args: {
          _actor: string
          _role: Database["public"]["Enums"]["app_role"]
          _target: string
        }
        Returns: undefined
      }
      skill_quiz_options_valid: { Args: { _o: Json }; Returns: boolean }
      skill_stage_rank: {
        Args: { _s: Database["public"]["Enums"]["skill_stage"] }
        Returns: number
      }
    }
    Enums: {
      action_type: "create" | "update" | "delete" | "login" | "logout"
      app_role:
        | "pi"
        | "postdoc"
        | "grad_student"
        | "undergrad_student"
        | "manager"
        | "user"
        | "pi_external"
      entity_type:
        | "booking"
        | "equipment"
        | "project"
        | "user"
        | "usage_record"
        | "profile"
      skill_stage:
        | "not_started"
        | "reading_done"
        | "trained"
        | "competent"
        | "trainer"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      action_type: ["create", "update", "delete", "login", "logout"],
      app_role: [
        "pi",
        "postdoc",
        "grad_student",
        "undergrad_student",
        "manager",
        "user",
        "pi_external",
      ],
      entity_type: [
        "booking",
        "equipment",
        "project",
        "user",
        "usage_record",
        "profile",
      ],
      skill_stage: [
        "not_started",
        "reading_done",
        "trained",
        "competent",
        "trainer",
      ],
    },
  },
} as const
