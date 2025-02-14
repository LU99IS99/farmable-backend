import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();

// 1. 中间件配置
app.use(cors());            // 允许跨域
app.use(express.json());    // 用于解析 JSON body

// 2. 配置 multer 存储在内存（便于演示）
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 3. 用一个全局数组暂存产品信息(仅限示范, 重启后会丢失)
let products = [];

// 4. GET /products - 返回当前所有产品信息
app.get('/products', (req, res) => {
  // 简单直接返回数组
  res.json(products);
});

// 5. POST /products - 接收表单+图片
//    前端传 FormData，包含 "image" 文件字段，和一个 "data" JSON字符串字段
app.post('/products', upload.single('image'), (req, res) => {
  try {
    // 解析前端传的 JSON 字段
    // 比如: formData.append("data", JSON.stringify({ productName, category, ... }))
    const productData = JSON.parse(req.body.data);

    // multer 把上传的文件放在 req.file
    const imageFile = req.file;

    // 可以在这里把 productData + imageFile.buffer 存入数据库或文件系统
    // 此处仅演示 -> push到一个数组
    const newProduct = {
      id: Date.now(),           // 简单用当前时间戳做ID
      ...productData,          // 产品的各种属性
      imageBuffer: imageFile?.buffer || null, // 图片的二进制数据
      imageMimeType: imageFile?.mimetype || null,
    };

    products.push(newProduct);

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