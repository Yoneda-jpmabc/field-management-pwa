/**
 * Supabase のスキーマから自動生成した型。手で編集しないこと。
 * スキーマを変更したら再生成する。
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      crops: {
        Row: {
          created_at: string;
          crop_code: string;
          deleted_at: string | null;
          display_order: number;
          id: string;
          is_active: boolean;
          name: string;
          unit: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          crop_code: string;
          deleted_at?: string | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          name: string;
          unit?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          crop_code?: string;
          deleted_at?: string | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          name?: string;
          unit?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      field_plantings: {
        Row: {
          area_a: number | null;
          created_at: string;
          crop_id: string;
          deleted_at: string | null;
          display_order: number;
          expected_quantity: number | null;
          field_id: string;
          id: string;
          memo: string | null;
          plant_count: number | null;
          planted_on: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          area_a?: number | null;
          created_at?: string;
          crop_id: string;
          deleted_at?: string | null;
          display_order?: number;
          expected_quantity?: number | null;
          field_id: string;
          id?: string;
          memo?: string | null;
          plant_count?: number | null;
          planted_on?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          area_a?: number | null;
          created_at?: string;
          crop_id?: string;
          deleted_at?: string | null;
          display_order?: number;
          expected_quantity?: number | null;
          field_id?: string;
          id?: string;
          memo?: string | null;
          plant_count?: number | null;
          planted_on?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "field_plantings_crop_id_fkey";
            columns: ["crop_id"];
            isOneToOne: false;
            referencedRelation: "crops";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "field_plantings_field_id_fkey";
            columns: ["field_id"];
            isOneToOne: false;
            referencedRelation: "fields";
            referencedColumns: ["id"];
          },
        ];
      };
      harvest_records: {
        Row: {
          created_at: string;
          created_by_worker_id: string | null;
          crop_id: string;
          deleted_at: string | null;
          field_id: string;
          harvest_date: string;
          id: string;
          memo: string | null;
          planting_id: string | null;
          quantity: number;
          unit: string;
          updated_at: string;
          worker_id: string | null;
        };
        Insert: {
          created_at?: string;
          created_by_worker_id?: string | null;
          crop_id: string;
          deleted_at?: string | null;
          field_id: string;
          harvest_date: string;
          id?: string;
          memo?: string | null;
          planting_id?: string | null;
          quantity: number;
          unit: string;
          updated_at?: string;
          worker_id?: string | null;
        };
        Update: {
          created_at?: string;
          created_by_worker_id?: string | null;
          crop_id?: string;
          deleted_at?: string | null;
          field_id?: string;
          harvest_date?: string;
          id?: string;
          memo?: string | null;
          planting_id?: string | null;
          quantity?: number;
          unit?: string;
          updated_at?: string;
          worker_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "harvest_records_created_by_worker_id_fkey";
            columns: ["created_by_worker_id"];
            isOneToOne: false;
            referencedRelation: "workers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "harvest_records_crop_id_fkey";
            columns: ["crop_id"];
            isOneToOne: false;
            referencedRelation: "crops";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "harvest_records_field_id_fkey";
            columns: ["field_id"];
            isOneToOne: false;
            referencedRelation: "fields";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "harvest_records_planting_id_fkey";
            columns: ["planting_id"];
            isOneToOne: false;
            referencedRelation: "field_plantings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "harvest_records_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "workers";
            referencedColumns: ["id"];
          },
        ];
      };
      fields: {
        Row: {
          area_a: number | null;
          created_at: string;
          crop: string | null;
          deleted_at: string | null;
          display_order: number;
          id: string;
          is_active: boolean;
          memo: string | null;
          name: string;
          updated_at: string;
        };
        Insert: {
          area_a?: number | null;
          created_at?: string;
          crop?: string | null;
          deleted_at?: string | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          memo?: string | null;
          name: string;
          updated_at?: string;
        };
        Update: {
          area_a?: number | null;
          created_at?: string;
          crop?: string | null;
          deleted_at?: string | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          memo?: string | null;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      work_plans: {
        Row: {
          created_at: string;
          created_by: string | null;
          crop_id: string | null;
          deleted_at: string | null;
          display_order: number;
          field_id: string | null;
          id: string;
          is_done: boolean;
          memo: string | null;
          plan_date: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          crop_id?: string | null;
          deleted_at?: string | null;
          display_order?: number;
          field_id?: string | null;
          id?: string;
          is_done?: boolean;
          memo?: string | null;
          plan_date: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          crop_id?: string | null;
          deleted_at?: string | null;
          display_order?: number;
          field_id?: string | null;
          id?: string;
          is_done?: boolean;
          memo?: string | null;
          plan_date?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "work_plans_crop_id_fkey";
            columns: ["crop_id"];
            isOneToOne: false;
            referencedRelation: "crops";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "work_plans_field_id_fkey";
            columns: ["field_id"];
            isOneToOne: false;
            referencedRelation: "fields";
            referencedColumns: ["id"];
          },
        ];
      };
      work_records: {
        Row: {
          batch_id: string | null;
          created_at: string;
          created_by: string | null;
          crop_id: string | null;
          deleted_at: string | null;
          end_time: string | null;
          field_id: string | null;
          id: string;
          memo: string | null;
          start_time: string | null;
          updated_at: string;
          work_date: string;
          work_type_id: string | null;
          work_type_raw: string | null;
          worker_id: string;
        };
        Insert: {
          batch_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          crop_id?: string | null;
          deleted_at?: string | null;
          end_time?: string | null;
          field_id?: string | null;
          id?: string;
          memo?: string | null;
          start_time?: string | null;
          updated_at?: string;
          work_date: string;
          work_type_id?: string | null;
          work_type_raw?: string | null;
          worker_id: string;
        };
        Update: {
          batch_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          crop_id?: string | null;
          deleted_at?: string | null;
          end_time?: string | null;
          field_id?: string | null;
          id?: string;
          memo?: string | null;
          start_time?: string | null;
          updated_at?: string;
          work_date?: string;
          work_type_id?: string | null;
          work_type_raw?: string | null;
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "work_records_crop_id_fkey";
            columns: ["crop_id"];
            isOneToOne: false;
            referencedRelation: "crops";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "work_records_field_id_fkey";
            columns: ["field_id"];
            isOneToOne: false;
            referencedRelation: "fields";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "work_records_work_type_id_fkey";
            columns: ["work_type_id"];
            isOneToOne: false;
            referencedRelation: "work_type_master";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "work_records_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "workers";
            referencedColumns: ["id"];
          },
        ];
      };
      work_type_master: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          display_order: number;
          id: string;
          is_active: boolean;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      work_type_raw_mapping: {
        Row: {
          created_at: string;
          raw_text: string;
          updated_at: string;
          work_type_id: string | null;
        };
        Insert: {
          created_at?: string;
          raw_text: string;
          updated_at?: string;
          work_type_id?: string | null;
        };
        Update: {
          created_at?: string;
          raw_text?: string;
          updated_at?: string;
          work_type_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "work_type_raw_mapping_work_type_id_fkey";
            columns: ["work_type_id"];
            isOneToOne: false;
            referencedRelation: "work_type_master";
            referencedColumns: ["id"];
          },
        ];
      };
      workers: {
        Row: {
          auth_user_id: string | null;
          created_at: string;
          deleted_at: string | null;
          department: string | null;
          display_order: number;
          employee_no: string | null;
          employment_type: string | null;
          id: string;
          is_active: boolean;
          language: string;
          login_id: string | null;
          main_role: string | null;
          name: string;
          permission: string;
          short_name: string | null;
          updated_at: string;
        };
        Insert: {
          auth_user_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          department?: string | null;
          display_order?: number;
          employee_no?: string | null;
          employment_type?: string | null;
          id?: string;
          is_active?: boolean;
          language?: string;
          login_id?: string | null;
          main_role?: string | null;
          name: string;
          permission?: string;
          short_name?: string | null;
          updated_at?: string;
        };
        Update: {
          auth_user_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          department?: string | null;
          display_order?: number;
          employee_no?: string | null;
          employment_type?: string | null;
          id?: string;
          is_active?: boolean;
          language?: string;
          login_id?: string | null;
          main_role?: string | null;
          name?: string;
          permission?: string;
          short_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      work_record_durations: {
        Row: {
          duration_minutes: number | null;
          field_id: string | null;
          id: string | null;
          work_date: string | null;
          work_type_label: string | null;
          worker_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "work_records_field_id_fkey";
            columns: ["field_id"];
            isOneToOne: false;
            referencedRelation: "fields";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "work_records_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "workers";
            referencedColumns: ["id"];
          },
        ];
      };
      work_type_raw_stats: {
        Row: {
          first_used_on: string | null;
          last_used_on: string | null;
          record_count: number | null;
          work_type_raw: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      harvest_summary_by_planting: {
        Args: { from_date?: string | null; to_date?: string | null };
        Returns: {
          crop_id: string;
          field_id: string;
          last_harvested_on: string | null;
          planting_id: string | null;
          record_count: number;
          total_quantity: number;
        }[];
      };
      work_summary_by_work_type: {
        Args: { from_date: string; to_date: string };
        Returns: {
          record_count: number;
          total_minutes: number;
          untimed_count: number;
          work_type_label: string;
        }[];
      };
      work_summary_by_worker: {
        Args: { from_date: string; to_date: string };
        Returns: {
          record_count: number;
          total_minutes: number;
          untimed_count: number;
          worker_id: string;
          worker_name: string;
        }[];
      };
      work_summary_by_worker_and_type: {
        Args: { from_date: string; to_date: string };
        Returns: {
          record_count: number;
          total_minutes: number;
          untimed_count: number;
          work_type_label: string;
          worker_id: string;
          worker_name: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database["public"];

export type Tables<
  Name extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]),
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[Name]["Row"];

export type TablesInsert<Name extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][Name]["Insert"];

export type TablesUpdate<Name extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][Name]["Update"];
