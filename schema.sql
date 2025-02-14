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
  productImage BLOB
);