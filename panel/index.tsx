import "./index.css";
import { createRoot } from "react-dom/client";
import AuthPage from "./auth.tsx";

document.addEventListener("DOMContentLoaded", () => {
    const root = createRoot(document.getElementById("root")!);
    root.render(<AuthPage />);
});