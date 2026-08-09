// Production environment. Replaced by environment.development.ts when
// building/serving with the "development" configuration (see angular.json
// fileReplacements).
//
// apiUrl es una ruta relativa a propósito: /api/* se sirve desde el mismo
// origen que el frontend (CloudFront lo proxea al ALB puertas adentro de
// AWS). El ALB todavía no tiene HTTPS propio, y CloudFront sirve el
// frontend siempre por HTTPS, así que apuntar directo al ALB rompería por
// mixed-content. Cuando el ALB tenga dominio + certificado ACM, el cambio
// se hace en la config de CloudFront (frontend.tf), no acá.
export const environment = {
  production: true,
  apiUrl: '/api',
  /** How long the code-runner editor must sit idle before auto-saving (ms). */
  codeAutoSaveIdleMs: 3000,
};
