// src/api/config.ts
// declare global {
//     interface Window {
//         _env_: {
//             API_URL: string;
//         }
//     }
// }

// @ts-ignore
// const API_URL = window._env_?.API_URL || import.meta.env.VITE_API_URL || 'http://localhost:80';
const API_URL = window.API_URL || import.meta.env.VITE_API_URL;

console.log(`Using API URL: ${API_URL}`);

export default API_URL;
