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
      ancestries: {
        Row: {
          ancestry_hp: number
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
      bags: {
        Row: {
          bag_name: string
          categories: Json
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bag_name?: string
          categories?: Json
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bag_name?: string
          categories?: Json
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      character_classes: {
        Row: {
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
      characters: {
        Row: {
          ancestry_name: string | null
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
          level: number
          name: string
          notes: string | null
          overlay: Json
          pathbuilder_data: Json | null
          pathbuilder_id: number | null
          status: string
          updated_at: string
          user_id: string
          wounded: number
        }
        Insert: {
          ancestry_name?: string | null
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
          level?: number
          name: string
          notes?: string | null
          overlay?: Json
          pathbuilder_data?: Json | null
          pathbuilder_id?: number | null
          status?: string
          updated_at?: string
          user_id: string
          wounded?: number
        }
        Update: {
          ancestry_name?: string | null
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
          level?: number
          name?: string
          notes?: string | null
          overlay?: Json
          pathbuilder_data?: Json | null
          pathbuilder_id?: number | null
          status?: string
          updated_at?: string
          user_id?: string
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
          updated_at: string
          weather: Json | null
        }
        Insert: {
          calendar?: Json | null
          discord_guild_id: string
          id?: string
          updated_at?: string
          weather?: Json | null
        }
        Update: {
          calendar?: Json | null
          discord_guild_id?: string
          id?: string
          updated_at?: string
          weather?: Json | null
        }
        Relationships: []
      }
      heritages: {
        Row: {
          ancestry_id: string
          benefits: Json
          created_at: string
          description: string | null
          id: string
          is_official: boolean
          is_versatile: boolean
          name: string
          source: string | null
          traits: Json
        }
        Insert: {
          ancestry_id: string
          benefits?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_official?: boolean
          is_versatile?: boolean
          name: string
          source?: string | null
          traits?: Json
        }
        Update: {
          ancestry_id?: string
          benefits?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_official?: boolean
          is_versatile?: boolean
          name?: string
          source?: string | null
          traits?: Json
        }
        Relationships: [
          {
            foreignKeyName: "heritages_ancestry_id_fkey"
            columns: ["ancestry_id"]
            isOneToOne: false
            referencedRelation: "ancestries"
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
      items: {
        Row: {
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
          created_at: string
          discord_avatar: string | null
          discord_discriminator: string | null
          discord_id: string
          discord_username: string
          email: string | null
          id: string
          is_admin: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          discord_avatar?: string | null
          discord_discriminator?: string | null
          discord_id: string
          discord_username: string
          email?: string | null
          id?: string
          is_admin?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          discord_avatar?: string | null
          discord_discriminator?: string | null
          discord_id?: string
          discord_username?: string
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
  public: {
    Enums: {},
  },
} as const
