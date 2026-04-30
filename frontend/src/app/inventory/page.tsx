"use client";

import { MainLayout } from "@/components/layout";
import { useBag, type BagCategories, type BagItem } from "@/lib/hooks/use-bag";
import { Package, Inbox } from "lucide-react";

function CategorySection({ name, items }: { name: string; items: BagItem[] }) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
        {name}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Empty</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span>{item.name}</span>
              {item.qty !== 1 && (
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                  ×{item.qty}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function InventoryPage() {
  const { data: bag, isLoading, error } = useBag();

  const categories = (bag?.categories ?? {}) as BagCategories;
  const categoryNames = Object.keys(categories).sort();

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold mb-2">
            {bag?.bag_name ?? "Inventory"}
          </h1>
          <p className="text-muted-foreground">
            Items synced from the bot via <code className="text-xs bg-muted px-1 rounded">/bag</code>
          </p>
        </div>
        <div className="p-3 rounded-lg bg-primary/10">
          <Package className="h-6 w-6 text-primary" />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="spinner" />
        </div>
      )}

      {error && (
        <div className="card p-6 bg-destructive/10 border-destructive">
          <p className="text-destructive font-semibold">Failed to load inventory</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
      )}

      {!isLoading && !error && !bag && (
        <div className="card p-12 text-center">
          <Inbox size={48} className="mx-auto text-muted-foreground mb-4" />
          <h2 className="font-heading text-2xl font-bold mb-2">No Bag Found</h2>
          <p className="text-muted-foreground">
            Use <code className="bg-muted px-1 rounded">/bag add</code> in Discord to add items.
            They&apos;ll sync here automatically.
          </p>
        </div>
      )}

      {!isLoading && !error && bag && categoryNames.length === 0 && (
        <div className="card p-12 text-center">
          <Package size={48} className="mx-auto text-muted-foreground mb-4" />
          <h2 className="font-heading text-2xl font-bold mb-2">Bag is Empty</h2>
          <p className="text-muted-foreground">
            Use <code className="bg-muted px-1 rounded">/bag add</code> in Discord to add items.
          </p>
        </div>
      )}

      {!isLoading && !error && bag && categoryNames.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryNames.map((cat) => (
            <CategorySection
              key={cat}
              name={cat}
              items={categories[cat] ?? []}
            />
          ))}
        </div>
      )}
    </MainLayout>
  );
}
