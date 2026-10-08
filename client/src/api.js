const API = import.meta.env.VITE_API_URL;

async function request(path, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('The server is waking up, please try again in a moment.');
    }
    throw new Error('Failed to fetch');
  } finally {
    clearTimeout(timeout);
  }
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