const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {}

export const API_URL =
  env.VITE_API_URL
  || process.env.VUE_APP_API_BASE_URL
  || ''
