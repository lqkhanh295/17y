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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          adminUser: string | null
          details: string | null
          id: string
          targetId: string | null
          timestamp: string | null
        }
        Insert: {
          action: string
          adminUser?: string | null
          details?: string | null
          id: string
          targetId?: string | null
          timestamp?: string | null
        }
        Update: {
          action?: string
          adminUser?: string | null
          details?: string | null
          id?: string
          targetId?: string | null
          timestamp?: string | null
        }
        Relationships: []
      }
      characters: {
        Row: {
          created_at: string | null
          direction: number | null
          honorific: string | null
          id: string
          name: string
          registrationId: string | null
          role: string | null
          scale: number | null
          wish: string | null
          x: number | null
          y: number | null
        }
        Insert: {
          created_at?: string | null
          direction?: number | null
          honorific?: string | null
          id: string
          name: string
          registrationId?: string | null
          role?: string | null
          scale?: number | null
          wish?: string | null
          x?: number | null
          y?: number | null
        }
        Update: {
          created_at?: string | null
          direction?: number | null
          honorific?: string | null
          id?: string
          name?: string
          registrationId?: string | null
          role?: string | null
          scale?: number | null
          wish?: string | null
          x?: number | null
          y?: number | null
        }
        Relationships: []
      }
      members: {
        Row: {
          created_at: string | null
          department: string | null
          fullName: string
          generation: string | null
          honorific: string | null
          id: string
          mssv: string | null
          role: string
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          fullName: string
          generation?: string | null
          honorific?: string | null
          id: string
          mssv?: string | null
          role: string
        }
        Update: {
          created_at?: string | null
          department?: string | null
          fullName?: string
          generation?: string | null
          honorific?: string | null
          id?: string
          mssv?: string | null
          role?: string
        }
        Relationships: []
      }
      memories: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          imagePath: string | null
          likes: number | null
          season: string | null
          tag: string | null
          title: string
          year: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id: string
          imagePath?: string | null
          likes?: number | null
          season?: string | null
          tag?: string | null
          title: string
          year?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          imagePath?: string | null
          likes?: number | null
          season?: string | null
          tag?: string | null
          title?: string
          year?: string | null
        }
        Relationships: []
      }
      registrations: {
        Row: {
          allergies: Json | null
          allergyNote: string | null
          approvedAt: string | null
          approvedBy: string | null
          checkedInAt: string | null
          checkedInBy: string | null
          createdAt: string | null
          emergencyPhone: string | null
          fullName: string
          gmail: string | null
          honorific: string | null
          id: string
          isApproved100: boolean | null
          isCheckedIn: boolean | null
          isEmailSent: boolean | null
          isPublicConsent: boolean | null
          memberId: string | null
          mssv: string | null
          package: string | null
          paidAmount: number | null
          paymentHistory: Json | null
          paymentPlan: string | null
          paymentStatus: string | null
          personalPhone: string | null
          plan: string | null
          receiptPhase1Url: string | null
          receiptPhase2Url: string | null
          rejectReason: string | null
          remainingAmount: number | null
          role: string | null
          status: string | null
          ticketCode: string | null
          ticketToken: string | null
          totalRequired: number | null
          verifiedAt: string | null
          verifiedBy: string | null
          wishes: string | null
          emailSentAt: string | null
          lastEmailTemplate: string | null
        }
        Insert: {
          allergies?: Json | null
          allergyNote?: string | null
          approvedAt?: string | null
          approvedBy?: string | null
          checkedInAt?: string | null
          checkedInBy?: string | null
          createdAt?: string | null
          emergencyPhone?: string | null
          fullName: string
          gmail?: string | null
          honorific?: string | null
          id: string
          isApproved100?: boolean | null
          isCheckedIn?: boolean | null
          isEmailSent?: boolean | null
          isPublicConsent?: boolean | null
          memberId?: string | null
          mssv?: string | null
          package?: string | null
          paidAmount?: number | null
          paymentHistory?: Json | null
          paymentPlan?: string | null
          paymentStatus?: string | null
          personalPhone?: string | null
          plan?: string | null
          receiptPhase1Url?: string | null
          receiptPhase2Url?: string | null
          rejectReason?: string | null
          remainingAmount?: number | null
          role?: string | null
          status?: string | null
          ticketCode?: string | null
          ticketToken?: string | null
          totalRequired?: number | null
          verifiedAt?: string | null
          verifiedBy?: string | null
          wishes?: string | null
          emailSentAt?: string | null
          lastEmailTemplate?: string | null
        }
        Update: {
          allergies?: Json | null
          allergyNote?: string | null
          approvedAt?: string | null
          approvedBy?: string | null
          checkedInAt?: string | null
          checkedInBy?: string | null
          createdAt?: string | null
          emergencyPhone?: string | null
          fullName?: string
          gmail?: string | null
          honorific?: string | null
          id?: string
          isApproved100?: boolean | null
          isCheckedIn?: boolean | null
          isEmailSent?: boolean | null
          isPublicConsent?: boolean | null
          memberId?: string | null
          mssv?: string | null
          package?: string | null
          paidAmount?: number | null
          paymentHistory?: Json | null
          paymentPlan?: string | null
          paymentStatus?: string | null
          personalPhone?: string | null
          plan?: string | null
          receiptPhase1Url?: string | null
          receiptPhase2Url?: string | null
          rejectReason?: string | null
          remainingAmount?: number | null
          role?: string | null
          status?: string | null
          ticketCode?: string | null
          ticketToken?: string | null
          totalRequired?: number | null
          verifiedAt?: string | null
          verifiedBy?: string | null
          wishes?: string | null
          emailSentAt?: string | null
          lastEmailTemplate?: string | null
        }
        Relationships: []
      }
      wishes: {
        Row: {
          authorName: string
          content: string
          createdAt: string | null
          id: string
          isPublic: boolean | null
          moderationStatus: string | null
          registrationId: string | null
          role: string | null
        }
        Insert: {
          authorName: string
          content: string
          createdAt?: string | null
          id: string
          isPublic?: boolean | null
          moderationStatus?: string | null
          registrationId?: string | null
          role?: string | null
        }
        Update: {
          authorName?: string
          content?: string
          createdAt?: string | null
          id?: string
          isPublic?: boolean | null
          moderationStatus?: string | null
          registrationId?: string | null
          role?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_members: {
        Args: {
          query_text: string
          max_limit?: number
        }
        Returns: {
          id: string
          mssv: string
          fullName: string
          role: string
          honorific: string
          generation: string
          department: string
          match_rank: number
        }[]
      }
      verify_admin_pin: {
        Args: {
          input_pin: string
        }
        Returns: boolean
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
    Enums: {},
  },
} as const
