// Chamadas para /recommendations do mib-backend, usando o helper `api`
// (que já cuida de URL base, JWT, refresh de token e aviso de cold start).
// Colocar em: src/services/recommendationsApi.js
import { api } from './api';

// OBS: os paths abaixo assumem que CONFIG.API_BASE já termina em "/api"
// (como /auth/refresh no seu api.js). Se não terminar, use "/api/recommendations".
const BASE = '/recommendations';

/** Recomendações do dia (o backend calcula se ainda não existirem). */
export const getRecommendations = () => api(`${BASE}/content`);

/** Recalcula as recomendações do dia. */
export const refreshRecommendations = () =>
  api(`${BASE}/content/refresh`, { method: 'POST' });

/** Usuário clicou numa recomendação. */
export const registerClick = (recommendationId) =>
  api(`${BASE}/content/${recommendationId}/click`, { method: 'POST' });

/** Lista de ids de recomendações que o usuário realmente viu. */
export const registerShown = (recommendationIds) =>
  api(`${BASE}/content/shown`, { method: 'POST', body: recommendationIds });