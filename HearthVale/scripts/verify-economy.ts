import { ITEM_BY_ID, NPC_BY_ID } from '../src/data/catalog/index.js';
import type { RecipeDefinition, ShopDefinition } from '../src/data/catalog/types.js';
import { loadJsonFile } from './lib/load-data.js';

const [shops, recipes] = await Promise.all([
  loadJsonFile<ShopDefinition[]>('catalog/shops.json'),
  loadJsonFile<RecipeDefinition[]>('catalog/recipes.json'),
]);
const errors: string[] = [];
const shopIds = new Set<string>();
const recipeIds = new Set<string>();
const shopNpcIds = new Set<string>();

for (const shop of shops) {
  if (shopIds.has(shop.id)) errors.push(`[shop] duplicate id "${shop.id}"`);
  shopIds.add(shop.id);
  if (shopNpcIds.has(shop.npcId)) errors.push(`[shop] multiple shops assigned to NPC "${shop.npcId}"`);
  shopNpcIds.add(shop.npcId);
  const npc = NPC_BY_ID.get(shop.npcId);
  if (!npc) errors.push(`[shop] ${shop.id}: unknown NPC "${shop.npcId}"`);
  else if (npc.role !== 'merchant') errors.push(`[shop] ${shop.id}: NPC "${shop.npcId}" is not a merchant`);
  if (shop.itemIds.length === 0) errors.push(`[shop] ${shop.id}: stock cannot be empty`);
  const seenItems = new Set<string>();
  for (const itemId of shop.itemIds) {
    if (seenItems.has(itemId)) errors.push(`[shop] ${shop.id}: duplicate stock item "${itemId}"`);
    seenItems.add(itemId);
    const item = ITEM_BY_ID.get(itemId);
    if (!item) errors.push(`[shop] ${shop.id}: unknown item "${itemId}"`);
    else if (item.kind === 'quest' || item.tradable === false) errors.push(`[shop] ${shop.id}: cannot stock protected item "${itemId}"`);
    else if (item.buyPrice === undefined) errors.push(`[shop] ${shop.id}: item "${itemId}" has no buyPrice`);
  }
}

for (const recipe of recipes) {
  if (recipeIds.has(recipe.id)) errors.push(`[recipe] duplicate id "${recipe.id}"`);
  recipeIds.add(recipe.id);
  if (!['alchemy', 'smithing', 'tailoring'].includes(recipe.category)) errors.push(`[recipe] ${recipe.id}: invalid category "${recipe.category}"`);
  if (recipe.stationNpcIds.length === 0) errors.push(`[recipe] ${recipe.id}: requires at least one station NPC`);
  for (const npcId of recipe.stationNpcIds) {
    if (!shopNpcIds.has(npcId)) errors.push(`[recipe] ${recipe.id}: station NPC "${npcId}" has no shop`);
  }
  if (!Number.isInteger(recipe.goldCost) || recipe.goldCost < 0) errors.push(`[recipe] ${recipe.id}: goldCost must be an integer >= 0`);
  if (recipe.requiredLevel !== undefined && (!Number.isInteger(recipe.requiredLevel) || recipe.requiredLevel < 1)) {
    errors.push(`[recipe] ${recipe.id}: requiredLevel must be an integer >= 1`);
  }
  const result = ITEM_BY_ID.get(recipe.result.itemId);
  if (!result) errors.push(`[recipe] ${recipe.id}: unknown result item "${recipe.result.itemId}"`);
  else if (result.kind === 'quest' || result.tradable === false) errors.push(`[recipe] ${recipe.id}: cannot craft protected item "${recipe.result.itemId}"`);
  if (!Number.isInteger(recipe.result.count) || recipe.result.count < 1) errors.push(`[recipe] ${recipe.id}: result count must be an integer >= 1`);
  if (recipe.ingredients.length === 0) errors.push(`[recipe] ${recipe.id}: ingredients cannot be empty`);
  const ingredientIds = new Set<string>();
  for (const ingredient of recipe.ingredients) {
    if (ingredientIds.has(ingredient.itemId)) errors.push(`[recipe] ${recipe.id}: duplicate ingredient "${ingredient.itemId}"`);
    ingredientIds.add(ingredient.itemId);
    if (!ITEM_BY_ID.has(ingredient.itemId)) errors.push(`[recipe] ${recipe.id}: unknown ingredient "${ingredient.itemId}"`);
    if (!Number.isInteger(ingredient.count) || ingredient.count < 1) errors.push(`[recipe] ${recipe.id}: ingredient count for "${ingredient.itemId}" must be an integer >= 1`);
    if (ingredient.itemId === recipe.result.itemId) errors.push(`[recipe] ${recipe.id}: result cannot also be an ingredient`);
  }
}

if (errors.length > 0) {
  console.error(`Economy verification failed (${errors.length} error(s)):`);
  for (const error of errors) console.error(`  ${error}`);
  process.exit(1);
}

console.log(`Economy verification passed (${shops.length} shops, ${recipes.length} recipes).`);
