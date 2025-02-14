import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { D1Database } from '@cloudflare/workers-types';

const app = express();

// 1. 中间件配置
app.use(cors());            // 允许跨域
app.use(express.json());    // 用于解析 JSON body

// 2. 配置 multer 存储在内存（便于演示）
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 3. 初始化 Cloudflare D1 数据库连接
const db = new D1Database('farmablebackendtest-db');

// 4. GET /products - 返回当前所有产品信息
app.get('/products', async (req, res) => {
  try {
    const { results } = await db.prepare("SELECT * FROM products ORDER BY id DESC").all();
    res.json(results);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 5. POST /products - 接收表单+图片
//    前端传 FormData，包含 "image" 文件字段，和一个 "data" JSON字符串字段
app.post('/products', upload.single('image'), async (req, res) => {
  try {
    // 解析前端传的 JSON 字段
    const productData = JSON.parse(req.body.data);

    // multer 把上传的文件放在 req.file
    const imageFile = req.file;

    // 将产品数据和图片存储到 Cloudflare D1 数据库
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
      productData.productName.trim(),
      productData.category.trim(),
      productData.unlimitedShelfLife ? null : productData.shelfLife,
      productData.unlimitedShelfLife ? null : productData.shelfLifeUnit,
      productData.unlimitedShelfLife ? 1 : 0,
      productData.packUnit.trim(),
      productData.description?.trim() || null,
      imageFile?.buffer || null
    ).run();

    if (!result.success) {
      console.error('Insert operation failed:', result);
      return res.status(500).json({ message: 'Failed to insert product' });
    }

    console.log('Product Data:', productData);
    console.log('Image File:', imageFile);

    // 返回成功 JSON
    res.status(200).json({ message: 'Product added successfully' });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 6. 启动服务器
const PORT = 8788;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});