// Chamadas para /api/recommendations do mib-backend.
// URL base da API (backend no Render).
const API_URL = "https://mib-backend-7p5h.onrender.com";

// AJUSTE 2: de onde vem o JWT. Se você já tem um helper de fetch/axios com
// token, troque `request` por ele e apague esta função.
function getToken() {
  return localStorage.getItem("accessToken");
}

async function request(path, { method = "GET", body, keepalive = false } = {}) {
  const res = await fetch(`${API_URL}/api/recommendations${path}`, {
    method,
    keepalive,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = new Error(`Erro ${res.status} ao acessar recomendações`);
    error.status = res.status;
    throw error;
  }
  return res.status === 204 ? null : res.json();
}

/** Recomendações do dia (o backend calcula se ainda não existirem). */
export const getRecommendations = () => request("/content");

/** Recalcula as recomendações do dia. */
export const refreshRecommendations = () =>
  request("/content/refresh", { method: "POST" });

/** Usuário clicou numa recomendação. keepalive garante o envio mesmo ao abrir outra aba. */
export const registerClick = (recommendationId) =>
  request(`/content/${recommendationId}/click`, {
    method: "POST",
    keepalive: true,
  });

/** Lista de ids de recomendações que o usuário realmente viu. */
export const registerShown = (recommendationIds) =>
  request("/content/shown", {
    method: "POST",
    body: recommendationIds,
    keepalive: true,
  });