/**
 * Build base URLs safely (fixes "http://host:portdownload/..." by ensuring a trailing slash)
 */
const rawBackendBase =
  (import.meta.env.PROD || import.meta.env.VITE_DEV_REMOTE == 'remote')
    ? import.meta.env.VITE_BACKEND_SERVER
    : 'http://localhost:5000/';

const BACKEND_BASE = rawBackendBase?.endsWith('/') ? rawBackendBase : rawBackendBase + '/';

export const API_BASE_URL = BACKEND_BASE + 'api/';
export const BASE_URL = BACKEND_BASE;

export const WEBSITE_URL = import.meta.env.PROD
  ? 'http://cloud.idurarapp.com/'
  : 'http://localhost:3000/';

export const DOWNLOAD_BASE_URL = BACKEND_BASE + 'download/';
export const ACCESS_TOKEN_NAME = 'x-auth-token';

export const FILE_BASE_URL = import.meta.env.VITE_FILE_BASE_URL;

//  console.log(
//    '🚀 Welcome to IDURAR ERP CRM! Did you know that we also offer commercial customization services? Contact us at hello@idurarapp.com for more information.'
//  );
