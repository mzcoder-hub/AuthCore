import { getToken } from "./authCore";

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const fetchWithAuth = async (endpoint: string, method = 'GET', body?: any) => {
  const token = getToken()
  console.log(token);
  const res = await fetch(`${API_URL}/${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Request failed');
  }

  return res.json();
};
