const pool = require('./db');

async function lookupCustomer(phone) {
  const c = await pool.query('SELECT * FROM customers WHERE phone = $1', [phone]);
  if (c.rows.length === 0) return null;
  const customer = c.rows[0];

  const s = await pool.query(
    `SELECT s.id, s.status, s.renewal_date, s.expiry_date,
            (s.expiry_date - CURRENT_DATE) AS days_left,
            p.name AS product_name, pl.name AS plan_name, pl.price,
            (SELECT status FROM orders o WHERE o.subscription_id = s.id
               ORDER BY order_date DESC, id DESC LIMIT 1) AS last_order_status,
            (SELECT delivery_date FROM orders o WHERE o.subscription_id = s.id
               ORDER BY order_date DESC, id DESC LIMIT 1) AS next_delivery
     FROM subscriptions s
     JOIN plans pl ON pl.id = s.plan_id
     JOIN products p ON p.id = pl.product_id
     WHERE s.customer_id = $1`,
    [customer.id]
  );

  const subscriptions = s.rows.map((sub) => {
    let alert = null;
    if (sub.days_left < 0) {
      alert = `Your ${sub.product_name} plan expired ${Math.abs(sub.days_left)} days ago. Renew to continue.`;
    } else if (sub.days_left <= 7) {
      alert = `Your ${sub.product_name} plan expires in ${sub.days_left} days. Renew soon.`;
    }
    return { ...sub, alert };
  });

  return { customer, subscriptions };
}

async function listProducts() {
  const r = await pool.query(
    `SELECT p.id AS product_id, p.name, p.description,
            pl.id AS plan_id, pl.name AS plan_name, pl.price
     FROM products p JOIN plans pl ON pl.product_id = p.id
     ORDER BY p.id, pl.interval_days`
  );
  const map = {};
  r.rows.forEach((row) => {
    if (!map[row.product_id]) {
      map[row.product_id] = { id: row.product_id, name: row.name, description: row.description, plans: [] };
    }
    map[row.product_id].plans.push({ id: row.plan_id, name: row.plan_name, price: row.price });
  });
  return Object.values(map);
}

async function registerCustomer({ name, phone, email, address }) {
  const r = await pool.query(
    `INSERT INTO customers (name, phone, email, address)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, phone, email, address]
  );
  return r.rows[0];
}

async function subscribe(customerId, planId) {
  const plan = await pool.query('SELECT interval_days FROM plans WHERE id = $1', [planId]);
  if (plan.rows.length === 0) return null;
  const days = plan.rows[0].interval_days;
  const r = await pool.query(
    `INSERT INTO subscriptions (customer_id, plan_id, start_date, renewal_date, expiry_date, status)
     VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + $3::int, CURRENT_DATE + $3::int, 'active')
     RETURNING *`,
    [customerId, planId, days]
  );
  return r.rows[0];
}

module.exports = { lookupCustomer, listProducts, registerCustomer, subscribe };