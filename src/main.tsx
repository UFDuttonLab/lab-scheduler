import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { consumeAuthCallback } from "./lib/authCallback";

// Must run before the first render. HashRouter reads window.location.hash immediately, and a
// Supabase recovery link arrives as "#access_token=..." or "#error=...", which the router would
// otherwise treat as an unknown route and answer with the 404 page.
consumeAuthCallback();

createRoot(document.getElementById("root")!).render(<App />);
