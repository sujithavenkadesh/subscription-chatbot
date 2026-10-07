DROP TABLE IF EXISTS orders, subscriptions, plans, products, customers CASCADE;

CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE plans (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id),
  name TEXT NOT NULL,
  interval_days INT NOT NULL,
  price NUMERIC(10,2) NOT NULL
);

CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id),
  plan_id INT REFERENCES plans(id),
  start_date DATE NOT NULL,
  renewal_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  subscription_id INT REFERENCES subscriptions(id),
  order_date DATE NOT NULL,
  delivery_date DATE,
  status TEXT NOT NULL DEFAULT 'placed'
);

INSERT INTO products (name, description) VALUES
  ('Fresh Milk', '1 litre fresh milk delivered daily'),
  ('Vegetable Box', 'Seasonal vegetables, about 5 kg'),
  ('Drinking Water Can', '20 litre can, delivered to your door'),
  ('Fruit Basket', 'Fresh seasonal fruits, about 3 kg');

INSERT INTO plans (product_id, name, interval_days, price) VALUES
  (1, 'Weekly', 7, 210), (1, 'Monthly', 30, 900),
  (2, 'Weekly', 7, 350), (2, 'Monthly', 30, 1400),
  (3, 'Weekly', 7, 140), (3, 'Monthly', 30, 560),
  (4, 'Weekly', 7, 300), (4, 'Monthly', 30, 1200);

-- Test customers (fake numbers)
INSERT INTO customers (name, phone, email, address) VALUES
  ('Arun Kumar', '9000000001', 'arun@example.com', 'Coimbatore'),
  ('Priya Devi', '9000000002', 'priya@example.com', 'Tirunelveli'),
  ('Karthik Raja', '9000000003', 'karthik@example.com', 'Chennai');

INSERT INTO subscriptions (customer_id, plan_id, start_date, renewal_date, expiry_date, status) VALUES
  (1, 2, CURRENT_DATE - 25, CURRENT_DATE + 5,  CURRENT_DATE + 5,  'active'),
  (2, 3, CURRENT_DATE - 40, CURRENT_DATE - 3,  CURRENT_DATE - 3,  'expired'),
  (3, 8, CURRENT_DATE - 10, CURRENT_DATE + 20, CURRENT_DATE + 20, 'active');

INSERT INTO orders (subscription_id, order_date, delivery_date, status) VALUES
  (1, CURRENT_DATE, CURRENT_DATE + 1, 'shipped'),
  (2, CURRENT_DATE - 10, CURRENT_DATE - 9, 'delivered'),
  (3, CURRENT_DATE, CURRENT_DATE + 2, 'packed');