import { db } from "@/db";
import { settings } from "@/db/schema/settings.schema";
import { PRODUCT_STOCK_TYPES, type ProductStockType } from "@/db/schema/product.schema";

const PREFIX = "stock_type_";
const SUFFIX_NAME = "_name";
const SUFFIX_DESCRIPTION = "_description";
const SUFFIX_IMAGE = "_image";

function keyName(slug: ProductStockType) {
  return `${PREFIX}${slug}${SUFFIX_NAME}`;
}
function keyDescription(slug: ProductStockType) {
  return `${PREFIX}${slug}${SUFFIX_DESCRIPTION}`;
}
function keyImage(slug: ProductStockType) {
  return `${PREFIX}${slug}${SUFFIX_IMAGE}`;
}

export type StockTypeDescription = {
  slug: ProductStockType;
  name: string;
  description: string;
  imageKey: string;
};

const DEFAULT_NAMES: Record<ProductStockType, string> = {
  individual: "Individual",
  family: "Family",
  invite: "Invite",
  customer_account: "Customer Account",
};

export async function getStockTypeDescriptions(): Promise<StockTypeDescription[]> {
  const rows = await db.select().from(settings);
  const map = new Map(rows.map((r) => [r.key, r.value]));

  return PRODUCT_STOCK_TYPES.map((slug) => ({
    slug,
    name: map.get(keyName(slug)) ?? DEFAULT_NAMES[slug],
    description: map.get(keyDescription(slug)) ?? "",
    imageKey: map.get(keyImage(slug)) ?? "",
  }));
}

export async function saveStockTypeDescription(
  slug: ProductStockType,
  data: { name: string; description: string; imageKey: string }
): Promise<void> {
  const entries: [string, string][] = [
    [keyName(slug), data.name],
    [keyDescription(slug), data.description],
    [keyImage(slug), data.imageKey],
  ];
  for (const [key, value] of entries) {
    await db
      .insert(settings)
      .values({ key, value: value ?? "" })
      .onConflictDoUpdate({ target: settings.key, set: { value: value ?? "" } });
  }
}
