export const INVENTORY_RENEWAL_TARGET_MODIFIER_PREFIX = "__inventory_renew_target_id__";

export function parseInventoryRenewalTargetId(modifierName: string): number | null {
  if (!modifierName?.startsWith(INVENTORY_RENEWAL_TARGET_MODIFIER_PREFIX)) return null;
  const raw = modifierName.slice(INVENTORY_RENEWAL_TARGET_MODIFIER_PREFIX.length);
  const id = parseInt(raw, 10);
  return Number.isFinite(id) ? id : null;
}

