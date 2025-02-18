CREATE TABLE IF NOT EXISTS products (
  product_id           INTEGER PRIMARY KEY,
  product_name         TEXT NOT NULL,
  category             TEXT,
  average_shelf_life   INTEGER,
  unlimited_shelf_life BOOLEAN,
  pack_unit            TEXT,
  description          TEXT,
  product_image        BLOB,          -- 新增: 图片字段
  created_at           TEXT,
  updated_at           TEXT
);
