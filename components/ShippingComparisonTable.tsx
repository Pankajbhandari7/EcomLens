import React from "react";
import { VariantData } from "@/lib/variants";

export function ShippingComparisonTable({
  variants,
}: {
  variants: VariantData[];
}) {
  if (!variants || variants.length === 0) return null;

  // Only show the table if shipping data exists
  if (variants[0].config.shippingPrice === undefined) return null;

  return (
    <div className="mt-12 w-full rounded-xl border border-line/30 bg-surface/50 overflow-hidden">
      <div className="p-4 border-b border-line/30 bg-surface">
        <h3 className="font-mono text-sm font-bold text-paper">
          Shipping Estimates Comparison
        </h3>
        <p className="font-mono text-[10px] text-paper/60 mt-1">
          Predicted prices based on estimated volumetric weight for each variant's padding.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs text-paper">
          <thead className="bg-surface/30 text-[10px] uppercase text-paper/50">
            <tr>
              <th className="px-4 py-3 font-medium">Variant ID</th>
              <th className="px-4 py-3 font-medium">Image Preview</th>
              <th className="px-4 py-3 font-medium">Estimated Volumetric Weight</th>
              <th className="px-4 py-3 font-medium">Assigned Slab</th>
              <th className="px-4 py-3 font-medium">Est. Price</th>
              <th className="px-4 py-3 font-medium">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/20">
            {variants.map((v) => (
              <tr key={v.config.id} className="hover:bg-surface/30 transition-colors">
                <td className="px-4 py-3 text-paper/60">{v.config.id.substring(0, 8)}...</td>
                <td className="px-4 py-3">
                  <div className="h-8 w-8 rounded overflow-hidden border border-line/20 bg-white flex-shrink-0">
                    <img src={v.url} alt={v.config.label} className="h-full w-full object-cover" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  {v.config.estimatedVolumetricWeightGrams 
                    ? `${(v.config.estimatedVolumetricWeightGrams / 1000).toFixed(2)} kg`
                    : <span className="text-paper/40">Ignored (Actual Weight Used)</span>}
                </td>
                <td className="px-4 py-3 text-accent">{v.config.shippingSlab}</td>
                <td className="px-4 py-3 font-bold text-yellow-400">₹{v.config.shippingPrice}</td>
                <td className="px-4 py-3 text-[10px] text-paper/50">{v.config.shippingConfidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
