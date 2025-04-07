import "../css/app.css";
import "./bootstrap";

import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./config/queryClient";
import MRouter from "./router";

const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <MRouter />
        </QueryClientProvider>
    );
};

createInertiaApp({
    title: (title) => `${title} - WebRPG`,
    resolve: () => App,
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: {
        color: "#4B5563",
    },
});
