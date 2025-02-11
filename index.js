import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/products', upload.single('image'), (req, res) => {
  try {
    const productData = JSON.parse(req.body.data);
    const imageFile = req.file;

    // 处理 productData 和 imageFile
    console.log('Product Data:', productData);
    console.log('Image File:', imageFile);

    res.status(200).json({ message: 'Product added successfully' });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

const PORT = 8788;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});