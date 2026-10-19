export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
        };
      };
      connected_accounts: {
        Row: {
          id: string;
          workspace_id: string;
          platform: string;
          platform_account_id: string;
          username: string | null;
          avatar_url: string | null;
          encrypted_access_token: string;
          token_iv: string;
          key_version: number;
          token_expires_at: string | null;
          scopes: string[];
          is_active: boolean;
          last_webhook_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          platform?: string;
          platform_account_id: string;
          username?: string | null;
          avatar_url?: string | null;
          encrypted_access_token: string;
          token_iv: string;
          key_version?: number;
          token_expires_at?: string | null;
          scopes?: string[];
          is_active?: boolean;
          last_webhook_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          platform?: string;
          platform_account_id?: string;
          username?: string | null;
          avatar_url?: string | null;
          encrypted_access_token?: string;
          token_iv?: string;
          key_version?: number;
          token_expires_at?: string | null;
          scopes?: string[];
          is_active?: boolean;
          last_webhook_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          workspace_id: string;
          platform_scoped_id: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          email: string | null;
          phone: string | null;
          custom_fields: Json;
          source_flow_id: string | null;
          opted_out: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          platform_scoped_id: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          phone?: string | null;
          custom_fields?: Json;
          source_flow_id?: string | null;
          opted_out?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          platform_scoped_id?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          phone?: string | null;
          custom_fields?: Json;
          source_flow_id?: string | null;
          opted_out?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
      };
      contact_tags: {
        Row: {
          contact_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          contact_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          contact_id?: string;
          tag_id?: string;
          created_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          workspace_id: string;
          contact_id: string;
          connected_account_id: string;
          status: "open" | "closed" | "archived";
          bot_paused: boolean;
          bot_paused_until: string | null;
          assigned_to: string | null;
          last_message_at: string | null;
          unread_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          contact_id: string;
          connected_account_id: string;
          status?: "open" | "closed" | "archived";
          bot_paused?: boolean;
          bot_paused_until?: string | null;
          assigned_to?: string | null;
          last_message_at?: string | null;
          unread_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          contact_id?: string;
          connected_account_id?: string;
          status?: "open" | "closed" | "archived";
          bot_paused?: boolean;
          bot_paused_until?: string | null;
          assigned_to?: string | null;
          last_message_at?: string | null;
          unread_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          workspace_id: string;
          conversation_id: string;
          direction: "inbound" | "outbound";
          source: "automation" | "human" | "system";
          content: string | null;
          media_url: string | null;
          media_type: string | null;
          platform_message_id: string | null;
          metadata: Json;
          sent_at: string | null;
          delivered_at: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          conversation_id: string;
          direction: "inbound" | "outbound";
          source?: "automation" | "human" | "system";
          content?: string | null;
          media_url?: string | null;
          media_type?: string | null;
          platform_message_id?: string | null;
          metadata?: Json;
          sent_at?: string | null;
          delivered_at?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          conversation_id?: string;
          direction?: "inbound" | "outbound";
          source?: "automation" | "human" | "system";
          content?: string | null;
          media_url?: string | null;
          media_type?: string | null;
          platform_message_id?: string | null;
          metadata?: Json;
          sent_at?: string | null;
          delivered_at?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
      };
      flows: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          description: string | null;
          status: "draft" | "published" | "paused" | "archived";
          trigger_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          description?: string | null;
          status?: "draft" | "published" | "paused" | "archived";
          trigger_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          description?: string | null;
          status?: "draft" | "published" | "paused" | "archived";
          trigger_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      flow_versions: {
        Row: {
          id: string;
          workspace_id: string;
          flow_id: string;
          version: number;
          definition: Json;
          published_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          flow_id: string;
          version?: number;
          definition: Json;
          published_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          flow_id?: string;
          version?: number;
          definition?: Json;
          published_at?: string | null;
          created_at?: string;
        };
      };
      flow_runs: {
        Row: {
          id: string;
          workspace_id: string;
          flow_id: string;
          flow_version_id: string;
          contact_id: string;
          current_node_id: string | null;
          status: "running" | "waiting" | "completed" | "failed" | "cancelled";
          context: Json;
          trigger_event_id: string | null;
          started_at: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          flow_id: string;
          flow_version_id: string;
          contact_id: string;
          current_node_id?: string | null;
          status?: "running" | "waiting" | "completed" | "failed" | "cancelled";
          context?: Json;
          trigger_event_id?: string | null;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          flow_id?: string;
          flow_version_id?: string;
          contact_id?: string;
          current_node_id?: string | null;
          status?: "running" | "waiting" | "completed" | "failed" | "cancelled";
          context?: Json;
          trigger_event_id?: string | null;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      webhook_events: {
        Row: {
          id: string;
          workspace_id: string | null;
          platform_event_id: string;
          event_type: string;
          payload: Json;
          status: "received" | "processing" | "processed" | "failed" | "dead";
          attempts: number;
          last_error: string | null;
          created_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          platform_event_id: string;
          event_type: string;
          payload: Json;
          status?: "received" | "processing" | "processed" | "failed" | "dead";
          attempts?: number;
          last_error?: string | null;
          created_at?: string;
          processed_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string | null;
          platform_event_id?: string;
          event_type?: string;
          payload?: Json;
          status?: "received" | "processing" | "processed" | "failed" | "dead";
          attempts?: number;
          last_error?: string | null;
          created_at?: string;
          processed_at?: string | null;
        };
      };
      automation_logs: {
        Row: {
          id: string;
          workspace_id: string;
          flow_run_id: string | null;
          flow_id: string | null;
          node_id: string | null;
          action: string;
          success: boolean;
          error_message: string | null;
          meta_response: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          flow_run_id?: string | null;
          flow_id?: string | null;
          node_id?: string | null;
          action: string;
          success: boolean;
          error_message?: string | null;
          meta_response?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          flow_run_id?: string | null;
          flow_id?: string | null;
          node_id?: string | null;
          action?: string;
          success?: boolean;
          error_message?: string | null;
          meta_response?: Json | null;
          created_at?: string;
        };
      };
      captured_leads: {
        Row: {
          id: string;
          workspace_id: string;
          contact_id: string;
          flow_id: string | null;
          field_name: string;
          field_value: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          contact_id: string;
          flow_id?: string | null;
          field_name: string;
          field_value: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          contact_id?: string;
          flow_id?: string | null;
          field_name?: string;
          field_value?: string;
          created_at?: string;
        };
      };
    };
    Enums: {
      workspace_role: "owner" | "admin" | "member";
      message_direction: "inbound" | "outbound";
      message_source: "automation" | "human" | "system";
      flow_status: "draft" | "published" | "paused" | "archived";
      flow_run_status: "running" | "waiting" | "completed" | "failed" | "cancelled";
    };
  };
};
