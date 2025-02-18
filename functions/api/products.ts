import type { Env } from '@cloudflare/workers-types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 只处理 /api/products 路径
    if (url.pathname === '/api/products') {
      if (request.method === 'GET') {
        return handleGetProducts(env);
      } else if (request.method === 'POST') {
        return handlePostProducts(request, env);
      } else {
        return new Response('Method Not Allowed', { status: 405 });
      }
    }

    // 不匹配 /api/products
    return new Response('Not Found', { status: 404 });
  },
};

/** =========================
 *  处理 GET /api/products
 *  =========================
 *  返回 products 表中所有记录，按 product_id 倒序
 */
async function handleGetProducts(env: Env): Promise<Response> {
  try {
    const { results } = await env.DB
      .prepare('SELECT * FROM products ORDER BY product_id DESC')
      .all();

    return jsonResponse(results || []);
  } catch (error: any) {
    return jsonResponse({ error: error.message }, 500);
  }
}

/** =========================
 *  处理 POST /api/products
 *  =========================
 *  支持 multipart/form-data，
 *  其中:
 *   - "data" 字段是 JSON 字符串
 *   - "image" 字段是 图片文件 (可选)
 */
async function handlePostProducts(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const contentType = request.headers.get('content-type') || '';

    // 如果是 multipart/form-data (上传文件)
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();

      // 1) 前端传的 JSON 数据放在 formData("data")
      const dataString = form.get('data');
      let productData: any = {};
      if (dataString && typeof dataString === 'string') {
        productData = JSON.parse(dataString);
      }

      // 2) 图片文件放在 "image" 字段
      let productImage: Uint8Array | null = null;
      const file = form.get('image');
      if (file && typeof file !== 'string') {
        const arrayBuf = await file.arrayBuffer();
        productImage = new Uint8Array(arrayBuf);
      }

      // 3) 组装要插入的列
      const productName = productData.productName || null;
      const category = productData.category || null;
      // 这里把前端 shelfLife => average_shelf_life
      const average_shelf_life = productData.shelfLife ?? null;
      const unlimited_shelf_life = productData.unlimitedShelfLife ? 1 : 0;
      const pack_unit = productData.packUnit || null;
      const description = productData.description || null;
      const created_at = new Date().toISOString();
      const updated_at = created_at;

      // 4) 插入数据库
      const sql = `
        INSERT INTO products (
          product_name,
          category,
          average_shelf_life,
          unlimited_shelf_life,
          pack_unit,
          description,
          product_image,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await env.DB.prepare(sql).bind(
        productName,
        category,
        average_shelf_life,
        unlimited_shelf_life,
        pack_unit,
        description,
        productImage,
        created_at,
        updated_at
      ).run();

      return jsonResponse({ success: true });
    } else {
      // 如果不是 multipart (可能纯 JSON)
      const body = await request.json();

      // 只做一个简单插入示例
      const productName = body.productName ?? null;
      const category = body.category ?? null;
      const average_shelf_life = body.shelfLife ?? null;
      const unlimited_shelf_life = body.unlimitedShelfLife ? 1 : 0;
      const pack_unit = body.packUnit ?? null;
      const description = body.description ?? null;
      const created_at = new Date().toISOString();
      const updated_at = created_at;

      const sql = `
        INSERT INTO products (
          product_name,
          category,
          average_shelf_life,
          unlimited_shelf_life,
          pack_unit,
          description,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await env.DB.prepare(sql).bind(
        productName,
        category,
        average_shelf_life,
        unlimited_shelf_life,
        pack_unit,
        description,
        created_at,
        updated_at
      ).run();

      return jsonResponse({ success: true });
    }
  } catch (error: any) {
    return jsonResponse({ error: error.message }, 500);
  }
}

/** 返回 JSON 的辅助函数 */
function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
