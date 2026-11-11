import { CLASSIC_DASHBOARD } from '@/config/featureFlags';
import { StudioProblem } from '@/studio/SharedScreens';
import { useEffect, useState } from "react";
import { useRouteError } from "react-router-dom";
// Import NotFoundPage directly (not lazy) for error handler reliability
// Error handlers should not depend on dynamic imports that might fail
import NotFoundPage from "../Pages/NotFoundPage/NotFoundPage";

function ClassicRouterErrorHandler() {
  const [hasChunkError, setHasChunkError] = useState(false);
  const error = useRouteError();
  // A page crash shows the 404 screen; log the real cause so it can be found
  if (error) console.error('[RouterError]', error);

  useEffect(() => {
    // Check if this is a chunk loading error
    const checkForChunkError = () => {
      if (!error) return;

      const message = error.message || "";
      const stack = error.stack || "";
      const toString = error.toString() || "";

      const chunkErrorPatterns = [
        "Failed to fetch dynamically imported module",
        "Loading chunk",
        "dynamically imported module",
        "ChunkLoadError",
        "Failed to load resource",
        "net::ERR_FILE_NOT_FOUND",
        "net::ERR_ABORTED"
      ];

      const isChunkError = chunkErrorPatterns.some(pattern => 
        message.includes(pattern) || 
        stack.includes(pattern) || 
        toString.includes(pattern)
      );

      if (isChunkError) {
        console.log("Chunk error detected in React Router:", error);
        setHasChunkError(true);
      }
    };

    checkForChunkError();
  }, [error]);

  const handleReload = () => {
    // Clear service workers if they exist
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => reg.unregister());
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  // If it's a chunk error, show the modal
  if (hasChunkError) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
        }}
      >
        <div
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: "1rem",
            textAlign: "center",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            maxWidth: "400px",
            margin: "1rem",
          }}
        >
          <div style={{ marginBottom: "1rem" }}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "#0BB248", margin: "0 auto 1rem" }}
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem", color: "#1f2937" }}>
            Update Available
          </h2>
          <p style={{ marginBottom: "1.5rem", color: "#6b7280", lineHeight: "1.5" }}>
            A new version of the app is available. Please refresh to continue with the latest updates.
          </p>
          <button
            onClick={handleReload}
            style={{
              padding: "0.75rem 2rem",
              backgroundColor: "#0BB248",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              fontWeight: "500",
              cursor: "pointer",
              fontSize: "1rem",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = "#0a9a3d"}
            onMouseOut={(e) => e.target.style.backgroundColor = "#0BB248"}
          >
            Refresh Now
          </button>
        </div>
      </div>
    );
  }

  // If it's not a chunk error, show the normal NotFoundPage
  // Direct import ensures NotFoundPage is available even when chunks fail to load
  return <NotFoundPage />;
}
export default function RouterErrorHandler() { return CLASSIC_DASHBOARD ? <ClassicRouterErrorHandler /> : <StudioProblem title="Something didn’t load" text="Try refreshing the page, or return to your studio." reload />; }
