import { Product, Env, ApiResponse } from '../types';
import { corsHeaders, handleOptions, createResponse } from '../utils/cors';

async function handleGetRequest(env: Env) {
  console.log('Executing GET request');
  const { results } = await env.DB.prepare(
    "SELECT * FROM products ORDER BY id DESC"
  ).all<Product>();

  return createResponse<Product[]>(results);
}

function isValidProduct(product: Product): boolean {
  return !!(
    product.productName &&
    product.category &&
    product.packUnit
  );
}

async function insertProduct(db: D1Database, product: Product) {
  const stmt = db.prepare(`
    INSERT INTO products (
      productName,
      category,
      shelfLife,
      shelfLifeUnit,
      unlimitedShelfLife,
      packUnit,
      description,
      productImage
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = await stmt.bind(
    product.productName.trim(),
    product.category.trim(),
    product.unlimitedShelfLife ? null : product.shelfLife,
    product.unlimitedShelfLife ? null : product.shelfLifeUnit,
    product.unlimitedShelfLife ? 1 : 0,
    product.packUnit.trim(),
    product.description?.trim() || null,
    product.productImage || null
  ).run();

  return {
    success: result.success,
    id: result.meta?.last_row_id
  };
}

async function getProductById(db: D1Database, id: number | undefined): Promise<Product | null> {
  if (!id) return null;

  const result = await db.prepare(
    "SELECT * FROM products WHERE id = ?"
  ).bind(id).first<Product>();

  return result || null;
}

async function handleDeleteRequest(env: Env, id: number) {
  try {
    console.log('Attempting to delete product:', id);

    // First check if product exists
    const product = await getProductById(env.DB, id);
    if (!product) {
      return createResponse<ApiResponse<null>>({
        success: false,
        error: "Product not found"
      }, 404);
    }

    // Delete the product
    const result = await env.DB.prepare(
      'DELETE FROM products WHERE id = ?'
    ).bind(id).run();

    if (!result.success) {
      return createResponse<ApiResponse<null>>({
        success: false,
        error: "Failed to delete product"
      }, 500);
    }

    return createResponse<ApiResponse<null>>({
      success: true,
      data: null
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return createResponse<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
}

async function handleUpdateRequest(request: Request, env: Env, id: number) {
  try {
    console.log('Attempting to update product:', id);

    // First check if product exists
    const existingProduct = await getProductById(env.DB, id);
    if (!existingProduct) {
      return createResponse<ApiResponse<null>>({
        success: false,
        error: "Product not found"
      }, 404);
    }

    const product = await request.json() as Product;
    console.log('Update data:', product);

    const result = await env.DB.prepare(`
      UPDATE products 
      SET productName = ?,
          category = ?,
          shelfLife = ?,
          shelfLifeUnit = ?,
          unlimitedShelfLife = ?,
          packUnit = ?,
          description = ?,
          productImage = ?
      WHERE id = ?
    `).bind(
      product.productName.trim(),
      product.category.trim(),
      product.unlimitedShelfLife ? null : product.shelfLife,
      product.unlimitedShelfLife ? null : product.shelfLifeUnit,
      product.unlimitedShelfLife ? 1 : 0,
      product.packUnit.trim(),
      product.description?.trim() || null,
      product.productImage || null,
      id
    ).run();

    if (!result.success) {
      console.error('Update failed:', result);
      return createResponse<ApiResponse<null>>({
        success: false,
        error: "Failed to update product"
      }, 500);
    }

    const updatedProduct = await getProductById(env.DB, id);
    console.log('Updated product:', updatedProduct);

    if (!updatedProduct) {
      return createResponse<ApiResponse<null>>({
        success: false,
        error: "Failed to retrieve updated product"
      }, 500);
    }

    return createResponse<ApiResponse<Product>>({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return createResponse<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
}

async function handlePostRequest(request: Request, env: Env) {
  try {
    console.log('Starting POST request handling');
    console.log('Database connection status:', !!env.DB);

    const formData = await request.formData();
    const product: Product = {
      productName: formData.get('productName') as string,
      category: formData.get('category') as string,
      shelfLife: formData.get('shelfLife') ? Number(formData.get('shelfLife')) : null,
      shelfLifeUnit: formData.get('shelfLifeUnit') as string,
      unlimitedShelfLife: formData.get('unlimitedShelfLife') === 'on',
      packUnit: formData.get('packUnit') as string,
      description: formData.get('description') as string,
      productImage: null // We'll handle the image separately
    };

    const imageFile = formData.get('productImage') as unknown as File;
    if (imageFile) {
      const imageData = await imageFile.arrayBuffer();
      product.productImage = btoa(String.fromCharCode(...new Uint8Array(imageData)));
    }

    console.log('Parsed request body:', product);

    if (!isValidProduct(product)) {
      console.log('Product validation failed:', {
        hasName: !!product.productName,
        hasCategory: !!product.category,
        hasPackUnit: !!product.packUnit
      });
      return createResponse<ApiResponse<Product>>({
        success: false,
        error: "Missing required fields",
        details: JSON.stringify(product)
      }, 400);
    }

    console.log('Product validation passed, attempting insert');
    const result = await insertProduct(env.DB, product);
    console.log('Insert operation result:', result);

    if (!result.success) {
      console.error('Insert operation failed:', result);
      return createResponse<ApiResponse<null>>({
        success: false,
        error: "Failed to insert product",
        details: JSON.stringify(result)
      }, 500);
    }

    console.log('Insert successful, retrieving new product');
    const newProduct = await getProductById(env.DB, result.id);
    console.log('Retrieved product:', newProduct);

    if (!newProduct) {
      console.error('Failed to retrieve newly created product');
      return createResponse<ApiResponse<null>>({
        success: false,
        error: "Failed to retrieve created product"
      }, 500);
    }

    return createResponse<ApiResponse<Product>>({
      success: true,
      data: newProduct
    });
  } catch (error) {
    console.error('Detailed error in handlePostRequest:', {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    throw error;
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    console.log('Request received:', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    });

    if (request.method === "OPTIONS") {
      return handleOptions();
    }

    try {
      switch (request.method) {
        case "PUT":
          const updateUrl = new URL(request.url);
          const updateId = updateUrl.pathname.split('/').pop();
          console.log('Handling PUT request for id:', updateId);
          return await handleUpdateRequest(request, env, Number(updateId));
        case "DELETE":
          const deleteUrl = new URL(request.url);
          const deleteId = deleteUrl.pathname.split('/').pop();
          return await handleDeleteRequest(env, Number(deleteId));
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
      console.error("Error in fetch:", error);
      return createResponse<ApiResponse<null>>({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: JSON.stringify(error)
      }, 500);
    }
  }
};