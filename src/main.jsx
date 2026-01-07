import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Toaster } from "react-hot-toast";
import { store } from "./app/store.js";
import { Provider } from "react-redux";
import ThemeBootstrap from "./components/ThemeBootstrap.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <Provider store={store}>
      <ThemeBootstrap />
      <Toaster
        position="top-center"
        containerStyle={{ zIndex: 100000 }}
        toastOptions={{
          // Ensure toasts stay above modals/overlays
          style: { zIndex: 100000 },
        }}
      />
      <App />
    </Provider>
  </ErrorBoundary>
);
