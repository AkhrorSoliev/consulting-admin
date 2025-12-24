import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Toaster } from "react-hot-toast";
import { store } from "./app/store.js";
import { Provider } from "react-redux";
import WinterSnowfall from "./components/WinterSnowfall.jsx";
import ThemeBootstrap from "./components/ThemeBootstrap.jsx";
createRoot(document.getElementById("root")).render(
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
    <WinterSnowfall />
    <App />
  </Provider>
);
