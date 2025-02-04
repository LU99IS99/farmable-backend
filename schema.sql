DROP TABLE IF EXISTS products;
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  productName TEXT NOT NULL,
  category TEXT NOT NULL,
  shelfLife INTEGER,
  shelfLifeUnit TEXT,
  unlimitedShelfLife BOOLEAN NOT NULL DEFAULT false,
  packUnit TEXT NOT NULL,
  description TEXT,
  productImage TEXT
);

DROP TABLE IF EXISTS inventory;
CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  productName TEXT NOT NULL,
  harvestedDate DATE NOT NULL,
  quality TEXT,
  quantity INTEGER NOT NULL,
  packUnit TEXT NOT NULL,
  pricePerUnit DECIMAL(10, 2) NOT NULL,
  sku TEXT NOT NULL,
  continueSellingWhenOutOfStock BOOLEAN DEFAULT false,
  notifyWhenInventoryLessThan INTEGER DEFAULT 10
);
