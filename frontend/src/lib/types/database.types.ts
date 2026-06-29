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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      actions: {
        Row: {
          action_category: string | null
          action_cost: string | null
          action_metadata: Json
          aon_id: string | null
          aon_url: string | null
          created_at: string
          description: string
          frequency: string | null
          id: string
          is_official: boolean
          name: string
          rarity: string
          requirements: string | null
          source: string | null
          traits: Json
          trigger: string | null
          updated_at: string
        }
        Insert: {
          action_category?: string | null
          action_cost?: string | null
          action_metadata?: Json
          aon_id?: string | null
          aon_url?: string | null
          created_at?: string
          description?: string
          frequency?: string | null
          id?: string
          is_official?: boolean
          name: string
          rarity?: string
          requirements?: string | null
          source?: string | null
          traits?: Json
          trigger?: string | null
          updated_at?: string
        }
        Update: {
          action_category?: string | null
          action_cost?: string | null
          action_metadata?: Json
          aon_id?: string | null
          aon_url?: string | null
          created_at?: string
          description?: string
          frequency?: string | null
          id?: string
          is_official?: boolean
          name?: string
          rarity?: string
          requirements?: string | null
          source?: string | null
          traits?: Json
          trigger?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ancestries: {
        Row: {
          ancestry_hp: number
          aon_id: string | null
          aon_url: string | null
          attribute_boosts: Json
          attribute_flaws: Json
          bonus_languages: number
          created_at: string
          created_by_user_id: string | null
          description: string | null
          discord_guild_id: string | null
          id: string
          is_official: boolean
          languages: Json
          name: string
          rarity: string
          senses: Json
          size: string
          source: string | null
          special_abilities: Json
          speed: number
          traits: Json
          updated_at: string
        }
        Insert: {
          ancestry_hp?: number
          aon_id?: string | null
          aon_url?: string | null
          attribute_boosts?: Json
          attribute_flaws?: Json
          bonus_languages?: number
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          discord_guild_id?: string | null
          id?: string
          is_official?: boolean
          languages?: Json
          name: string
          rarity?: string
          senses?: Json
          size?: string
          source?: string | null
          special_abilities?: Json
          speed?: number
          traits?: Json
          updated_at?: string
        }
        Update: {
          ancestry_hp?: number
          aon_id?: string | null
          aon_url?: string | null
          attribute_boosts?: Json
          attribute_flaws?: Json
          bonus_languages?: number
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          discord_guild_id?: string | null
          id?: string
          is_official?: boolean
          languages?: Json
          name?: string
          rarity?: string
          senses?: Json
          size?: string
          source?: string | null
          special_abilities?: Json
          speed?: number
          traits?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ancestries_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      archetypes: {
        Row: {
          aon_id: string | null
          aon_url: string | null
          archetype_type: string
          created_at: string
          created_by_user_id: string | null
          description: string | null
          discord_guild_id: string | null
          id: string
          is_official: boolean
          name: string
          rarity: string
          source: string | null
          traits: Json
          updated_at: string
        }
        Insert: {
          aon_id?: string | null
          aon_url?: string | null
          archetype_type?: string
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          discord_guild_id?: string | null
          id?: string
          is_official?: boolean
          name: string
          rarity?: string
          source?: string | null
          traits?: Json
          updated_at?: string
        }
        Update: {
          aon_id?: string | null
          aon_url?: string | null
          archetype_type?: string
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          discord_guild_id?: string | null
          id?: string
          is_official?: boolean
          name?: string
          rarity?: string
          source?: string | null
          traits?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "archetypes_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      backgrounds: {
        Row: {
          aon_id: string | null
          aon_url: string | null
          attribute_boosts: Json
          background_metadata: Json
          created_at: string
          created_by_user_id: string | null
          description: string | null
          discord_guild_id: string | null
          id: string
          is_official: boolean
          lore_skills: Json
          name: string
          rarity: string
          skill_proficiencies: Json
          source: string | null
          updated_at: string
        }
        Insert: {
          aon_id?: string | null
          aon_url?: string | null
          attribute_boosts?: Json
          background_metadata?: Json
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          discord_guild_id?: string | null
          id?: string
          is_official?: boolean
          lore_skills?: Json
          name: string
          rarity?: string
          skill_proficiencies?: Json
          source?: string | null
          updated_at?: string
        }
        Update: {
          aon_id?: string | null
          aon_url?: string | null
          attribute_boosts?: Json
          background_metadata?: Json
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          discord_guild_id?: string | null
          id?: string
          is_official?: boolean
          lore_skills?: Json
          name?: string
          rarity?: string
          skill_proficiencies?: Json
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "backgrounds_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bag_items: {
        Row: {
          category: string
          char_key: string
          created_at: string
          custom_name: string | null
          display_name: string
          homebrew_id: string | null
          id: string
          item_id: string | null
          notes: string | null
          quantity: number
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          char_key?: string
          created_at?: string
          custom_name?: string | null
          display_name: string
          homebrew_id?: string | null
          id?: string
          item_id?: string | null
          notes?: string | null
          quantity?: number
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          char_key?: string
          created_at?: string
          custom_name?: string | null
          display_name?: string
          homebrew_id?: string | null
          id?: string
          item_id?: string | null
          notes?: string | null
          quantity?: number
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bag_items_homebrew_id_fkey"
            columns: ["homebrew_id"]
            isOneToOne: false
            referencedRelation: "homebrew_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bag_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bag_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bags: {
        Row: {
          bag_name: string
          categories: Json
          char_key: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bag_name?: string
          categories?: Json
          char_key?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bag_name?: string
          categories?: Json
          char_key?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      character_audit_log: {
        Row: {
          action: string
          actor_kind: string
          actor_user_id: string | null
          after_value: Json | null
          before_value: Json | null
          character_id: string
          created_at: string
          field: string | null
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_kind?: string
          actor_user_id?: string | null
          after_value?: Json | null
          before_value?: Json | null
          character_id: string
          created_at?: string
          field?: string | null
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_kind?: string
          actor_user_id?: string | null
          after_value?: Json | null
          before_value?: Json | null
          character_id?: string
          created_at?: string
          field?: string | null
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "character_audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_audit_log_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_builder_drafts: {
        Row: {
          builder_state: Json
          created_at: string
          current_step: number
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          builder_state?: Json
          created_at?: string
          current_step?: number
          id?: string
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          builder_state?: Json
          created_at?: string
          current_step?: number
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_builder_drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      character_class_features: {
        Row: {
          character_id: string
          class_feature_id: string
          created_at: string
          id: string
          level_acquired: number
          selection: Json
          updated_at: string
        }
        Insert: {
          character_id: string
          class_feature_id: string
          created_at?: string
          id?: string
          level_acquired: number
          selection?: Json
          updated_at?: string
        }
        Update: {
          character_id?: string
          class_feature_id?: string
          created_at?: string
          id?: string
          level_acquired?: number
          selection?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_class_features_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_class_features_class_feature_id_fkey"
            columns: ["class_feature_id"]
            isOneToOne: false
            referencedRelation: "class_features"
            referencedColumns: ["id"]
          },
        ]
      }
      character_classes: {
        Row: {
          aon_id: string | null
          aon_url: string | null
          class_features: Json
          class_hp: number
          class_metadata: Json
          created_at: string
          created_by_user_id: string | null
          description: string | null
          discord_guild_id: string | null
          id: string
          initial_proficiencies: Json
          is_official: boolean
          is_spellcaster: boolean
          key_attribute: Json
          name: string
          source: string | null
          spellcasting_ability: string | null
          updated_at: string
        }
        Insert: {
          aon_id?: string | null
          aon_url?: string | null
          class_features?: Json
          class_hp?: number
          class_metadata?: Json
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          discord_guild_id?: string | null
          id?: string
          initial_proficiencies?: Json
          is_official?: boolean
          is_spellcaster?: boolean
          key_attribute?: Json
          name: string
          source?: string | null
          spellcasting_ability?: string | null
          updated_at?: string
        }
        Update: {
          aon_id?: string | null
          aon_url?: string | null
          class_features?: Json
          class_hp?: number
          class_metadata?: Json
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          discord_guild_id?: string | null
          id?: string
          initial_proficiencies?: Json
          is_official?: boolean
          is_spellcaster?: boolean
          key_attribute?: Json
          name?: string
          source?: string | null
          spellcasting_ability?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_classes_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      character_feats: {
        Row: {
          character_id: string
          created_at: string
          feat_id: string
          feat_slot: string
          id: string
          level_acquired: number
          notes: string | null
          selection: Json
          updated_at: string
        }
        Insert: {
          character_id: string
          created_at?: string
          feat_id: string
          feat_slot: string
          id?: string
          level_acquired?: number
          notes?: string | null
          selection?: Json
          updated_at?: string
        }
        Update: {
          character_id?: string
          created_at?: string
          feat_id?: string
          feat_slot?: string
          id?: string
          level_acquired?: number
          notes?: string | null
          selection?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_feats_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_feats_feat_id_fkey"
            columns: ["feat_id"]
            isOneToOne: false
            referencedRelation: "feats"
            referencedColumns: ["id"]
          },
        ]
      }
      character_known_spells: {
        Row: {
          character_id: string
          created_at: string
          id: string
          is_signature: boolean
          notes: string | null
          rank: number
          spell_id: string
          spell_source: string
          tradition: string
          updated_at: string
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          is_signature?: boolean
          notes?: string | null
          rank?: number
          spell_id: string
          spell_source?: string
          tradition: string
          updated_at?: string
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          is_signature?: boolean
          notes?: string | null
          rank?: number
          spell_id?: string
          spell_source?: string
          tradition?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_known_spells_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_known_spells_spell_id_fkey"
            columns: ["spell_id"]
            isOneToOne: false
            referencedRelation: "spells"
            referencedColumns: ["id"]
          },
        ]
      }
      character_levels: {
        Row: {
          character_id: string
          choices: Json
          created_at: string
          id: string
          level: number
          notes: string | null
          snapshot: Json
          updated_at: string
        }
        Insert: {
          character_id: string
          choices?: Json
          created_at?: string
          id?: string
          level: number
          notes?: string | null
          snapshot?: Json
          updated_at?: string
        }
        Update: {
          character_id?: string
          choices?: Json
          created_at?: string
          id?: string
          level?: number
          notes?: string | null
          snapshot?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_levels_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_notes: {
        Row: {
          char_key: string
          id: string
          next_id: number
          notes: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          char_key: string
          id?: string
          next_id?: number
          notes?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          char_key?: string
          id?: string
          next_id?: number
          notes?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      character_overrides: {
        Row: {
          character_id: string
          created_at: string
          created_by_user_id: string | null
          enabled: boolean
          id: string
          reason: string | null
          stat_key: string
          updated_at: string
          value: Json
        }
        Insert: {
          character_id: string
          created_at?: string
          created_by_user_id?: string | null
          enabled?: boolean
          id?: string
          reason?: string | null
          stat_key: string
          updated_at?: string
          value: Json
        }
        Update: {
          character_id?: string
          created_at?: string
          created_by_user_id?: string | null
          enabled?: boolean
          id?: string
          reason?: string | null
          stat_key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "character_overrides_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_overrides_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      character_prepared_spells: {
        Row: {
          character_id: string
          id: string
          is_expended: boolean
          prepared_at: string
          rank: number
          slot_index: number
          spell_id: string
        }
        Insert: {
          character_id: string
          id?: string
          is_expended?: boolean
          prepared_at?: string
          rank: number
          slot_index: number
          spell_id: string
        }
        Update: {
          character_id?: string
          id?: string
          is_expended?: boolean
          prepared_at?: string
          rank?: number
          slot_index?: number
          spell_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_prepared_spells_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_prepared_spells_spell_id_fkey"
            columns: ["spell_id"]
            isOneToOne: false
            referencedRelation: "spells"
            referencedColumns: ["id"]
          },
        ]
      }
      character_versions: {
        Row: {
          character_id: string
          created_at: string
          created_by_user_id: string | null
          id: string
          label: string | null
          snapshot: Json
          version_number: number
        }
        Insert: {
          character_id: string
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          label?: string | null
          snapshot: Json
          version_number: number
        }
        Update: {
          character_id?: string
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          label?: string | null
          snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_versions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_versions_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      character_xp_log: {
        Row: {
          amount: number
          awarded_by_discord_id: string | null
          char_key: string
          created_at: string
          entry_type: string
          id: string
          new_xp: number
          old_xp: number
          reason: string | null
          user_id: string
        }
        Insert: {
          amount: number
          awarded_by_discord_id?: string | null
          char_key: string
          created_at?: string
          entry_type?: string
          id?: string
          new_xp?: number
          old_xp?: number
          reason?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          awarded_by_discord_id?: string | null
          char_key?: string
          created_at?: string
          entry_type?: string
          id?: string
          new_xp?: number
          old_xp?: number
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_xp_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          ancestry_name: string | null
          art: string | null
          background_name: string | null
          char_key: string | null
          class_name: string | null
          created_at: string
          currency: Json
          current_hp: number | null
          discord_guild_id: string | null
          dying: number
          experience: number
          heritage_name: string | null
          hero_points: number
          id: string
          is_public: boolean
          level: number
          name: string
          notes: string | null
          overlay: Json
          pathbuilder_data: Json | null
          pathbuilder_id: number | null
          public_share_id: string
          source: string
          status: string
          updated_at: string
          user_id: string
          variant_rules: Json
          wounded: number
        }
        Insert: {
          ancestry_name?: string | null
          art?: string | null
          background_name?: string | null
          char_key?: string | null
          class_name?: string | null
          created_at?: string
          currency?: Json
          current_hp?: number | null
          discord_guild_id?: string | null
          dying?: number
          experience?: number
          heritage_name?: string | null
          hero_points?: number
          id?: string
          is_public?: boolean
          level?: number
          name: string
          notes?: string | null
          overlay?: Json
          pathbuilder_data?: Json | null
          pathbuilder_id?: number | null
          public_share_id?: string
          source?: string
          status?: string
          updated_at?: string
          user_id: string
          variant_rules?: Json
          wounded?: number
        }
        Update: {
          ancestry_name?: string | null
          art?: string | null
          background_name?: string | null
          char_key?: string | null
          class_name?: string | null
          created_at?: string
          currency?: Json
          current_hp?: number | null
          discord_guild_id?: string | null
          dying?: number
          experience?: number
          heritage_name?: string | null
          hero_points?: number
          id?: string
          is_public?: boolean
          level?: number
          name?: string
          notes?: string | null
          overlay?: Json
          pathbuilder_data?: Json | null
          pathbuilder_id?: number | null
          public_share_id?: string
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
          variant_rules?: Json
          wounded?: number
        }
        Relationships: [
          {
            foreignKeyName: "characters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      class_features: {
        Row: {
          aon_id: string | null
          aon_url: string | null
          archetype_id: string | null
          character_class_id: string | null
          class_feature_metadata: Json
          created_at: string
          description: string
          id: string
          is_choice: boolean
          is_official: boolean
          level: number
          name: string
          rarity: string
          source: string | null
          traits: Json
          updated_at: string
        }
        Insert: {
          aon_id?: string | null
          aon_url?: string | null
          archetype_id?: string | null
          character_class_id?: string | null
          class_feature_metadata?: Json
          created_at?: string
          description?: string
          id?: string
          is_choice?: boolean
          is_official?: boolean
          level?: number
          name: string
          rarity?: string
          source?: string | null
          traits?: Json
          updated_at?: string
        }
        Update: {
          aon_id?: string | null
          aon_url?: string | null
          archetype_id?: string | null
          character_class_id?: string | null
          class_feature_metadata?: Json
          created_at?: string
          description?: string
          id?: string
          is_choice?: boolean
          is_official?: boolean
          level?: number
          name?: string
          rarity?: string
          source?: string | null
          traits?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_features_archetype_id_fkey"
            columns: ["archetype_id"]
            isOneToOne: false
            referencedRelation: "archetypes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_features_character_class_id_fkey"
            columns: ["character_class_id"]
            isOneToOne: false
            referencedRelation: "character_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      companions: {
        Row: {
          base_type: string
          char_key: string
          comp_key: string
          created_at: string
          current_hp: number | null
          custom_stats: Json | null
          display_name: string
          form: string
          id: string
          is_active: boolean
          notes: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_type: string
          char_key: string
          comp_key: string
          created_at?: string
          current_hp?: number | null
          custom_stats?: Json | null
          display_name: string
          form?: string
          id?: string
          is_active?: boolean
          notes?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_type?: string
          char_key?: string
          comp_key?: string
          created_at?: string
          current_hp?: number | null
          custom_stats?: Json | null
          display_name?: string
          form?: string
          id?: string
          is_active?: boolean
          notes?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "companions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conditions: {
        Row: {
          aon_id: string | null
          aon_url: string | null
          condition_metadata: Json
          created_at: string
          description: string
          has_value: boolean
          id: string
          is_official: boolean
          name: string
          source: string | null
          updated_at: string
        }
        Insert: {
          aon_id?: string | null
          aon_url?: string | null
          condition_metadata?: Json
          created_at?: string
          description?: string
          has_value?: boolean
          id?: string
          is_official?: boolean
          name: string
          source?: string | null
          updated_at?: string
        }
        Update: {
          aon_id?: string | null
          aon_url?: string | null
          condition_metadata?: Json
          created_at?: string
          description?: string
          has_value?: boolean
          id?: string
          is_official?: boolean
          name?: string
          source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          discord_username: string | null
          email: string
          id: string
          ip_address: string | null
          message: string
          name: string
          status: string
          subject: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          discord_username?: string | null
          email: string
          id?: string
          ip_address?: string | null
          message: string
          name: string
          status?: string
          subject: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          discord_username?: string | null
          email?: string
          id?: string
          ip_address?: string | null
          message?: string
          name?: string
          status?: string
          subject?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      downtime: {
        Row: {
          bank: number
          char_key: string
          id: string
          last_accrual_date: string
          log: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          bank?: number
          char_key: string
          id?: string
          last_accrual_date: string
          log?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          bank?: number
          char_key?: string
          id?: string
          last_accrual_date?: string
          log?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "downtime_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      encounter_events: {
        Row: {
          actor: string | null
          created_at: string
          data: Json
          encounter_id: string
          event_type: string
          id: string
          round: number | null
          target: string | null
        }
        Insert: {
          actor?: string | null
          created_at?: string
          data?: Json
          encounter_id: string
          event_type: string
          id?: string
          round?: number | null
          target?: string | null
        }
        Update: {
          actor?: string | null
          created_at?: string
          data?: Json
          encounter_id?: string
          event_type?: string
          id?: string
          round?: number | null
          target?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "encounter_events_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      encounters: {
        Row: {
          channel_id: string
          combatants: Json
          discord_guild_id: string
          ended_at: string | null
          gm_discord_id: string | null
          id: string
          round: number
          started_at: string
          status: string
          turn_index: number
          updated_at: string
        }
        Insert: {
          channel_id: string
          combatants?: Json
          discord_guild_id: string
          ended_at?: string | null
          gm_discord_id?: string | null
          id?: string
          round?: number
          started_at?: string
          status?: string
          turn_index?: number
          updated_at?: string
        }
        Update: {
          channel_id?: string
          combatants?: Json
          discord_guild_id?: string
          ended_at?: string | null
          gm_discord_id?: string | null
          id?: string
          round?: number
          started_at?: string
          status?: string
          turn_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      feats: {
        Row: {
          action_cost: string | null
          aon_id: string | null
          aon_url: string | null
          created_at: string
          created_by_user_id: string | null
          description: string
          discord_guild_id: string | null
          feat_metadata: Json
          feat_type: string | null
          id: string
          is_official: boolean
          level: number
          name: string
          prerequisites: string | null
          rarity: string
          source: string | null
          traits: Json
          trigger: string | null
          updated_at: string
        }
        Insert: {
          action_cost?: string | null
          aon_id?: string | null
          aon_url?: string | null
          created_at?: string
          created_by_user_id?: string | null
          description?: string
          discord_guild_id?: string | null
          feat_metadata?: Json
          feat_type?: string | null
          id?: string
          is_official?: boolean
          level?: number
          name: string
          prerequisites?: string | null
          rarity?: string
          source?: string | null
          traits?: Json
          trigger?: string | null
          updated_at?: string
        }
        Update: {
          action_cost?: string | null
          aon_id?: string | null
          aon_url?: string | null
          created_at?: string
          created_by_user_id?: string | null
          description?: string
          discord_guild_id?: string | null
          feat_metadata?: Json
          feat_type?: string | null
          id?: string
          is_official?: boolean
          level?: number
          name?: string
          prerequisites?: string | null
          rarity?: string
          source?: string | null
          traits?: Json
          trigger?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feats_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_submissions: {
        Row: {
          created_at: string
          description: string
          id: string
          metadata: Json
          status: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          metadata?: Json
          status?: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          metadata?: Json
          status?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gamedata: {
        Row: {
          category: string
          data: Json
          id: number
          name: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          category: string
          data: Json
          id?: number
          name?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          category?: string
          data?: Json
          id?: number
          name?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      guild_settings: {
        Row: {
          allowed_rulebooks: string[]
          bot_enabled: boolean
          channel_config: Json
          command_prefix: string | null
          created_at: string
          discord_guild_id: string
          features_enabled: Json
          guild_icon_url: string | null
          guild_name: string | null
          homebrew_enabled: boolean
          id: string
          updated_at: string
        }
        Insert: {
          allowed_rulebooks?: string[]
          bot_enabled?: boolean
          channel_config?: Json
          command_prefix?: string | null
          created_at?: string
          discord_guild_id: string
          features_enabled?: Json
          guild_icon_url?: string | null
          guild_name?: string | null
          homebrew_enabled?: boolean
          id?: string
          updated_at?: string
        }
        Update: {
          allowed_rulebooks?: string[]
          bot_enabled?: boolean
          channel_config?: Json
          command_prefix?: string | null
          created_at?: string
          discord_guild_id?: string
          features_enabled?: Json
          guild_icon_url?: string | null
          guild_name?: string | null
          homebrew_enabled?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      guild_snippets: {
        Row: {
          discord_guild_id: string
          id: string
          snippets: Json
          updated_at: string
        }
        Insert: {
          discord_guild_id: string
          id?: string
          snippets?: Json
          updated_at?: string
        }
        Update: {
          discord_guild_id?: string
          id?: string
          snippets?: Json
          updated_at?: string
        }
        Relationships: []
      }
      guild_state: {
        Row: {
          calendar: Json | null
          discord_guild_id: string
          id: string
          settings: Json | null
          updated_at: string
          weather: Json | null
        }
        Insert: {
          calendar?: Json | null
          discord_guild_id: string
          id?: string
          settings?: Json | null
          updated_at?: string
          weather?: Json | null
        }
        Update: {
          calendar?: Json | null
          discord_guild_id?: string
          id?: string
          settings?: Json | null
          updated_at?: string
          weather?: Json | null
        }
        Relationships: []
      }
      heritages: {
        Row: {
          ancestry_id: string | null
          aon_id: string | null
          aon_url: string | null
          benefits: Json
          created_at: string
          created_by_user_id: string | null
          description: string | null
          discord_guild_id: string | null
          id: string
          is_official: boolean
          is_versatile: boolean
          name: string
          source: string | null
          traits: Json
          updated_at: string
        }
        Insert: {
          ancestry_id?: string | null
          aon_id?: string | null
          aon_url?: string | null
          benefits?: Json
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          discord_guild_id?: string | null
          id?: string
          is_official?: boolean
          is_versatile?: boolean
          name: string
          source?: string | null
          traits?: Json
          updated_at?: string
        }
        Update: {
          ancestry_id?: string | null
          aon_id?: string | null
          aon_url?: string | null
          benefits?: Json
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          discord_guild_id?: string | null
          id?: string
          is_official?: boolean
          is_versatile?: boolean
          name?: string
          source?: string | null
          traits?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "heritages_ancestry_id_fkey"
            columns: ["ancestry_id"]
            isOneToOne: false
            referencedRelation: "ancestries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heritages_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      homebrew_entries: {
        Row: {
          added_by: string | null
          created_at: string
          data: Json
          entry_key: string
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          data: Json
          entry_key: string
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          data?: Json
          entry_key?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      homebrew_pack_entries: {
        Row: {
          created_at: string
          homebrew_entry_id: string
          id: string
          notes: string | null
          pack_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          homebrew_entry_id: string
          id?: string
          notes?: string | null
          pack_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          homebrew_entry_id?: string
          id?: string
          notes?: string | null
          pack_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "homebrew_pack_entries_homebrew_entry_id_fkey"
            columns: ["homebrew_entry_id"]
            isOneToOne: false
            referencedRelation: "homebrew_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homebrew_pack_entries_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "homebrew_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      homebrew_packs: {
        Row: {
          content_types: string[]
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          owner_id: string
          status: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          content_types?: string[]
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          owner_id: string
          status?: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          content_types?: string[]
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          owner_id?: string
          status?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "homebrew_packs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          aon_id: string | null
          aon_url: string | null
          bulk: string | null
          created_at: string
          created_by_user_id: string | null
          description: string
          discord_guild_id: string | null
          id: string
          is_magical: boolean
          is_official: boolean
          item_metadata: Json
          item_subtype: string | null
          item_type: string
          level: number
          name: string
          price_cp: number
          rarity: string
          source: string | null
          traits: Json
          updated_at: string
          usage: string | null
        }
        Insert: {
          aon_id?: string | null
          aon_url?: string | null
          bulk?: string | null
          created_at?: string
          created_by_user_id?: string | null
          description?: string
          discord_guild_id?: string | null
          id?: string
          is_magical?: boolean
          is_official?: boolean
          item_metadata?: Json
          item_subtype?: string | null
          item_type?: string
          level?: number
          name: string
          price_cp?: number
          rarity?: string
          source?: string | null
          traits?: Json
          updated_at?: string
          usage?: string | null
        }
        Update: {
          aon_id?: string | null
          aon_url?: string | null
          bulk?: string | null
          created_at?: string
          created_by_user_id?: string | null
          description?: string
          discord_guild_id?: string | null
          id?: string
          is_magical?: boolean
          is_official?: boolean
          item_metadata?: Json
          item_subtype?: string | null
          item_type?: string
          level?: number
          name?: string
          price_cp?: number
          rarity?: string
          source?: string | null
          traits?: Json
          updated_at?: string
          usage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      monster_art: {
        Row: {
          art: Json
          discord_guild_id: string
          id: string
          updated_at: string
        }
        Insert: {
          art?: Json
          discord_guild_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          art?: Json
          discord_guild_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      monster_attacks: {
        Row: {
          attacks: Json
          created_at: string
          discord_guild_id: string
          id: string
          updated_at: string
        }
        Insert: {
          attacks?: Json
          created_at?: string
          discord_guild_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          attacks?: Json
          created_at?: string
          discord_guild_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      monster_edits: {
        Row: {
          discord_guild_id: string
          edits: Json
          id: string
          updated_at: string
        }
        Insert: {
          discord_guild_id: string
          edits?: Json
          id?: string
          updated_at?: string
        }
        Update: {
          discord_guild_id?: string
          edits?: Json
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      monster_items: {
        Row: {
          custom_name: string | null
          display_name: string
          homebrew_id: string | null
          id: string
          item_id: string | null
          monster_entry_id: string
          quantity: number
          sort_order: number
        }
        Insert: {
          custom_name?: string | null
          display_name: string
          homebrew_id?: string | null
          id?: string
          item_id?: string | null
          monster_entry_id: string
          quantity?: number
          sort_order?: number
        }
        Update: {
          custom_name?: string | null
          display_name?: string
          homebrew_id?: string | null
          id?: string
          item_id?: string | null
          monster_entry_id?: string
          quantity?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "monster_items_homebrew_id_fkey"
            columns: ["homebrew_id"]
            isOneToOne: false
            referencedRelation: "homebrew_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monster_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monster_items_monster_entry_id_fkey"
            columns: ["monster_entry_id"]
            isOneToOne: false
            referencedRelation: "homebrew_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      monsters: {
        Row: {
          abilities: Json
          ability_modifiers: Json
          ac: number
          alignment: string
          attacks: Json
          companion_types: Json
          created_at: string
          created_by_user_id: string | null
          creature_type: string
          description: string | null
          discord_guild_id: string | null
          hp: number
          id: string
          immunities: Json
          is_companion: boolean
          is_official: boolean
          languages: Json
          level: number
          monster_metadata: Json
          name: string
          perception: number
          rarity: string
          resistances: Json
          saving_throws: Json
          size: string
          source: string | null
          speed: Json
          spellcasting: Json | null
          traits: Json
          updated_at: string
          weaknesses: Json
        }
        Insert: {
          abilities?: Json
          ability_modifiers?: Json
          ac?: number
          alignment?: string
          attacks?: Json
          companion_types?: Json
          created_at?: string
          created_by_user_id?: string | null
          creature_type?: string
          description?: string | null
          discord_guild_id?: string | null
          hp?: number
          id?: string
          immunities?: Json
          is_companion?: boolean
          is_official?: boolean
          languages?: Json
          level?: number
          monster_metadata?: Json
          name: string
          perception?: number
          rarity?: string
          resistances?: Json
          saving_throws?: Json
          size?: string
          source?: string | null
          speed?: Json
          spellcasting?: Json | null
          traits?: Json
          updated_at?: string
          weaknesses?: Json
        }
        Update: {
          abilities?: Json
          ability_modifiers?: Json
          ac?: number
          alignment?: string
          attacks?: Json
          companion_types?: Json
          created_at?: string
          created_by_user_id?: string | null
          creature_type?: string
          description?: string | null
          discord_guild_id?: string | null
          hp?: number
          id?: string
          immunities?: Json
          is_companion?: boolean
          is_official?: boolean
          languages?: Json
          level?: number
          monster_metadata?: Json
          name?: string
          perception?: number
          rarity?: string
          resistances?: Json
          saving_throws?: Json
          size?: string
          source?: string | null
          speed?: Json
          spellcasting?: Json | null
          traits?: Json
          updated_at?: string
          weaknesses?: Json
        }
        Relationships: [
          {
            foreignKeyName: "monsters_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          ability: string
          created_at: string
          description: string
          id: string
          key: string
          name: string
          sort_order: number
        }
        Insert: {
          ability: string
          created_at?: string
          description?: string
          id?: string
          key: string
          name: string
          sort_order?: number
        }
        Update: {
          ability?: string
          created_at?: string
          description?: string
          id?: string
          key?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      spells: {
        Row: {
          aon_id: string | null
          aon_url: string | null
          area: string | null
          cast_actions: string | null
          classes: Json
          created_at: string
          created_by_user_id: string | null
          defense: string | null
          description: string
          discord_guild_id: string | null
          duration: string
          heightening: Json | null
          id: string
          is_focus_spell: boolean
          is_official: boolean
          is_ritual: boolean
          level: number
          name: string
          range_text: string
          rarity: string
          source: string
          spell_metadata: Json
          traditions: Json
          traits: Json
          updated_at: string
        }
        Insert: {
          aon_id?: string | null
          aon_url?: string | null
          area?: string | null
          cast_actions?: string | null
          classes?: Json
          created_at?: string
          created_by_user_id?: string | null
          defense?: string | null
          description?: string
          discord_guild_id?: string | null
          duration?: string
          heightening?: Json | null
          id?: string
          is_focus_spell?: boolean
          is_official?: boolean
          is_ritual?: boolean
          level: number
          name: string
          range_text?: string
          rarity?: string
          source?: string
          spell_metadata?: Json
          traditions?: Json
          traits?: Json
          updated_at?: string
        }
        Update: {
          aon_id?: string | null
          aon_url?: string | null
          area?: string | null
          cast_actions?: string | null
          classes?: Json
          created_at?: string
          created_by_user_id?: string | null
          defense?: string | null
          description?: string
          discord_guild_id?: string | null
          duration?: string
          heightening?: Json | null
          id?: string
          is_focus_spell?: boolean
          is_official?: boolean
          is_ritual?: boolean
          level?: number
          name?: string
          range_text?: string
          rarity?: string
          source?: string
          spell_metadata?: Json
          traditions?: Json
          traits?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spells_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_guild_active_characters: {
        Row: {
          active_char_key: string
          created_at: string
          discord_guild_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_char_key: string
          created_at?: string
          discord_guild_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_char_key?: string
          created_at?: string
          discord_guild_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_guild_active_characters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_snippets: {
        Row: {
          id: string
          snippets: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          snippets?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          snippets?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_snippets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          active_char_key: string | null
          created_at: string
          discord_avatar: string | null
          discord_discriminator: string | null
          discord_id: string
          discord_username: string | null
          email: string | null
          id: string
          is_admin: boolean
          updated_at: string
        }
        Insert: {
          active_char_key?: string | null
          created_at?: string
          discord_avatar?: string | null
          discord_discriminator?: string | null
          discord_id: string
          discord_username?: string | null
          email?: string | null
          id?: string
          is_admin?: boolean
          updated_at?: string
        }
        Update: {
          active_char_key?: string | null
          created_at?: string
          discord_avatar?: string | null
          discord_discriminator?: string | null
          discord_id?: string
          discord_username?: string | null
          email?: string | null
          id?: string
          is_admin?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
