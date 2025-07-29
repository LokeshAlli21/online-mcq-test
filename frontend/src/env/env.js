const env = {
    backendUrl: String(import.meta.env.VITE_BACKEND_URL), // endpoint
    backendUrlProduction: String(import.meta.env.VITE_BACKEND_URL_PRODUCTION), // production endpoint
    production: Boolean(import.meta.env.VITE_PRODUCTION === "true"), // production mode
}
export default env