import { Product, Inventory, Env, ApiResponse } from '../types';
import { corsHeaders, handleOptions, createResponse } from '../utils/cors';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return handleOptions();
    }

    try {
      switch (request.method) {
        case "POST":
          return await handlePostRequest(request, env);
        case "GET":
          return await handleGetRequest(env);
        default:
          return createResponse<ApiResponse<null>>({
            success: false,
            error: "Method not allowed"
          }, 405);
      }
    } catch (error) {
      console.error("Error:", error);
      return createResponse<ApiResponse<null>>({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: JSON.stringify(error)
      }, 500);
    }
  }
};

async function handlePostRequest(request: Request, env: Env) {
  const body = await request.json() as Inventory;
  console.log('Received POST data:', body);

  // Validate required fields
  if (!isValidInventory(body)) {
    return createResponse<ApiResponse<Inventory>>({
      success: false,
      error: "Missing required fields",
      details: JSON.stringify(body)
    }, 400);
  }

  const result = await insertInventory(env.DB, body);

  if (!result.success) {
    return createResponse<ApiResponse<null>>({
      success: false,
      error: "Failed to insert inventory"
    }, 500);
  }

  const newInventory = await getInventoryById(env.DB, result.id);

  if (!newInventory) {
    return createResponse<ApiResponse<null>>({
      success: false,
      error: "Failed to retrieve created inventory"
    }, 500);
  }

  return createResponse<ApiResponse<Inventory>>({
    success: true,
    data: newInventory
  });
}

async function handleGetRequest(env: Env) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM inventory ORDER BY id DESC"
  ).all<Inventory>();

  return createResponse<Inventory[]>(results);
}

async function insertInventory(db: D1Database, inventory: Inventory) {
  const stmt = db.prepare(`
    INSERT INTO inventory (
      productName,
      harvestedDate,
      quality,
      quantity,
      packUnit,
      pricePerUnit,
      sku,
      continueSellingWhenOutOfStock,
      notifyWhenInventoryLessThan
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = await stmt.bind(
    inventory.productName.trim(),
    inventory.harvestedDate,
    inventory.quality?.trim() || null,
    inventory.quantity,
    inventory.packUnit.trim(),
    inventory.pricePerUnit,
    inventory.sku.trim(),
    inventory.continueSellingWhenOutOfStock ? 1 : 0,
    inventory.notifyWhenInventoryLessThan
  ).run();

  return {
    success: result.success,
    id: result.meta?.last_row_id
  };
}

async function getInventoryById(db: D1Database, id: number | undefined): Promise<Inventory | null> {
  if (!id) return null;

  const result = await db.prepare(
    "SELECT * FROM inventory WHERE id = ?"
  ).bind(id).first<Inventory>();

  return result || null;
}

function isValidInventory(inventory: Inventory): boolean {
  return !!(
    inventory.productName &&
    inventory.harvestedDate &&
    inventory.quantity &&
    inventory.packUnit &&
    inventory.pricePerUnit &&
    inventory.sku
  );
}
