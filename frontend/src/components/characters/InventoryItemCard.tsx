/**
 * InventoryItemCard Component
 *
 * Displays an item in a character's inventory with:
 * - Item name, type, and rarity
 * - Quantity and equipped status
 * - Weight calculation
 * - Quick actions (equip, drop, use)
 * - Weapon/armor stats if applicable
 */

"use client";

import {
  Shield,
  Swords,
  Package,
  Trash2,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

interface InventoryItem {
  id: string;
  item_id: string;
  item_name: string;
  item_type: string;
  rarity: string;
  quantity: number;
  is_equipped: boolean;
  is_magical?: boolean;
  weight_lb: number;
  description?: string;
  // Weapon properties
  weapon_properties?: {
    damage_dice: string;
    damage_type: string;
  };
  // Armor properties
  armor_properties?: {
    base_ac: number;
    dex_bonus?: "none" | "max_2" | "full";
  };
  // Container/notes
  container?: string;
  notes?: string;
}

interface InventoryItemCardProps {
  item: InventoryItem;
  onEquipToggle?: (itemId: string, isEquipped: boolean) => void;
  onQuantityChange?: (itemId: string, newQuantity: number) => void;
  onRemove?: (itemId: string) => void;
  onUse?: (itemId: string) => void;
  compact?: boolean;
  className?: string;
}

export function InventoryItemCard({
  item,
  onEquipToggle,
  onQuantityChange,
  onRemove,
  onUse,
  compact = false,
  className = "",
}: InventoryItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate total weight
  const totalWeight = item.weight_lb * item.quantity;

  // Get rarity color
  const getRarityColor = (rarity: string): string => {
    const colors: Record<string, string> = {
      common: "text-muted-foreground border-muted",
      uncommon: "text-chart-2 border-chart-2/30 bg-chart-2/10",
      rare: "text-chart-1 border-chart-1/30 bg-chart-1/10",
      very_rare: "text-chart-3 border-chart-3/30 bg-chart-3/10",
      legendary: "text-chart-4 border-chart-4/30 bg-chart-4/10",
      artifact: "text-chart-5 border-chart-5/30 bg-chart-5/10",
    };
    return colors[rarity] || colors.common;
  };

  // Get item type icon
  const getItemIcon = () => {
    if (item.item_type === "weapon" || item.weapon_properties) {
      return <Swords className="w-4 h-4" />;
    }
    if (item.item_type === "armor" || item.armor_properties) {
      return <Shield className="w-4 h-4" />;
    }
    return <Package className="w-4 h-4" />;
  };

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 p-2 rounded-lg border border-border hover:bg-accent/50 transition-colors ${className}`}
      >
        {/* Icon */}
        <div className="text-muted-foreground">{getItemIcon()}</div>

        {/* Name & quantity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">
              {item.item_name}
            </span>
            {item.is_magical && <Sparkles className="w-3 h-3 text-chart-3" />}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {item.quantity > 1 && <span>×{item.quantity}</span>}
            {totalWeight > 0 && <span>{totalWeight} lb</span>}
          </div>
        </div>

        {/* Equipped badge */}
        {item.is_equipped && (
          <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded">
            Equipped
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`card p-4 hover:shadow-md transition-all ${
        item.is_equipped ? "border-primary/50 shadow-sm" : ""
      } ${className}`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-muted-foreground">{getItemIcon()}</div>
              <h4 className="text-base font-heading font-semibold truncate">
                {item.item_name}
              </h4>
              {item.is_magical && (
                <Sparkles className="w-4 h-4 text-chart-3 flex-shrink-0" />
              )}
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="badge badge-secondary capitalize">
                {item.item_type.replace("_", " ")}
              </span>
              <span
                className={`badge ${getRarityColor(item.rarity)} capitalize`}
              >
                {item.rarity.replace("_", " ")}
              </span>
              {item.is_equipped && (
                <span className="badge bg-primary/10 text-primary border-primary/20">
                  Equipped
                </span>
              )}
            </div>
          </div>

          {/* Quantity */}
          {item.quantity > 1 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-accent rounded text-sm font-medium">
              <span className="text-muted-foreground">×</span>
              <span>{item.quantity}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {item.weapon_properties && (
            <div>
              <span className="text-muted-foreground">Damage:</span>{" "}
              <span className="font-medium">
                {item.weapon_properties.damage_dice}{" "}
                {item.weapon_properties.damage_type}
              </span>
            </div>
          )}
          {item.armor_properties && (
            <div>
              <span className="text-muted-foreground">AC:</span>{" "}
              <span className="font-medium">
                {item.armor_properties.base_ac}
                {item.armor_properties.dex_bonus === "full" && " + Dex"}
                {item.armor_properties.dex_bonus === "max_2" &&
                  " + Dex (max 2)"}
              </span>
            </div>
          )}
          {totalWeight > 0 && (
            <div>
              <span className="text-muted-foreground">Weight:</span>{" "}
              <span className="font-medium">{totalWeight} lb</span>
            </div>
          )}
          {item.container && (
            <div>
              <span className="text-muted-foreground">Location:</span>{" "}
              <span className="font-medium">{item.container}</span>
            </div>
          )}
        </div>

        {/* Description (expandable) */}
        {item.description && (
          <div className="text-sm">
            <p
              className={`text-muted-foreground ${
                isExpanded ? "" : "line-clamp-2"
              }`}
            >
              {item.description}
            </p>
            {item.description.length > 100 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-primary hover:underline text-xs mt-1"
              >
                {isExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}

        {/* Notes */}
        {item.notes && (
          <div className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2">
            {item.notes}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border">
          {/* Equip/Unequip */}
          {onEquipToggle &&
            (item.item_type === "weapon" ||
              item.item_type === "armor" ||
              item.item_type === "shield") && (
              <button
                onClick={() => onEquipToggle(item.id, !item.is_equipped)}
                className={`flex-1 btn-outline gap-1 text-xs h-8 ${
                  item.is_equipped ? "border-primary text-primary" : ""
                }`}
              >
                {item.is_equipped ? (
                  <>
                    <X className="h-3 w-3" />
                    Unequip
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3" />
                    Equip
                  </>
                )}
              </button>
            )}

          {/* Use (consumables) */}
          {onUse && item.item_type === "consumable" && (
            <button
              onClick={() => onUse(item.id)}
              className="flex-1 btn-primary gap-1 text-xs h-8"
            >
              Use
            </button>
          )}

          {/* Remove */}
          {onRemove && (
            <button
              onClick={() => onRemove(item.id)}
              className="btn-outline gap-1 text-xs h-8 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              title="Remove from inventory"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * InventoryGrid Component
 *
 * Displays multiple inventory items in a grid layout
 */
interface InventoryGridProps {
  items: InventoryItem[];
  onEquipToggle?: (itemId: string, isEquipped: boolean) => void;
  onQuantityChange?: (itemId: string, newQuantity: number) => void;
  onRemove?: (itemId: string) => void;
  onUse?: (itemId: string) => void;
  compact?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function InventoryGrid({
  items,
  onEquipToggle,
  onQuantityChange,
  onRemove,
  onUse,
  compact = false,
  emptyMessage = "No items in inventory",
  className = "",
}: InventoryGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={`${
        compact
          ? "space-y-1"
          : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      } ${className}`}
    >
      {items.map((item) => (
        <InventoryItemCard
          key={item.id}
          item={item}
          onEquipToggle={onEquipToggle}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
          onUse={onUse}
          compact={compact}
        />
      ))}
    </div>
  );
}
