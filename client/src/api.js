const API = import.meta.env.VITE_API_URL;

async function request(path, options) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

export const lookupCustomer = (phone) => request(`/api/customers/lookup/${phone}`);
export const registerCustomer = (body) =>
  request('/api/customers', { method: 'POST', body: JSON.stringify(body) });
export const getProducts = () => request('/api/products');
export const subscribe = (customerId, planId) =>
  request('/api/subscriptions', { method: 'POST', body: JSON.stringify({ customerId, planId }) });