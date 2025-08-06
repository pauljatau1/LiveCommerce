import { useEffect, useState } from "react";
import PropTypes from "prop-types";

export default function ChunkErrorBoundary({ children }) {
  const [hasChunkError, setHasChunkError] = useState(false);

  useEffect(() => {
    const detectChunkError = (error) => {
      if (!error) return;

      const message = error.message || "";
      const name = error.name || "";
      const stack = error.stack || "";

      // Detect various types of chunk loading errors
      const chunkErrorPatterns = [
        "ChunkLoadError",
        "Loading chunk",
        "dynamically imported module",
        "JavaScript module script",
        "MIME type",
        "Unexpected token '<'",
        "Failed to fetch dynamically imported module",
        "Loading CSS chunk",
        "Loading failed for the",
        "Failed to load resource",
        "net::ERR_ABORTED",
        "net::ERR_FILE_NOT_FOUND",
        "net::ERR_NAME_NOT_RESOLVED",
        "net::ERR_CONNECTION_REFUSED",
        "net::ERR_NETWORK",
        "net::ERR_INTERNET_DISCONNECTED"
      ];

      const isChunkLoadError = 
        name === "ChunkLoadError" ||
        chunkErrorPatterns.some(pattern => 
          message.includes(pattern) || stack.includes(pattern)
        );

      if (isChunkLoadError) {
        console.log("Chunk error detected:", error);
        setHasChunkError(true);
      }
    };

    const onError = (event) => {
      // Check for script loading errors
      const scriptErrorPatterns = [
        "Error loading chunk",
        "dynamically imported module",
        "Failed to fetch dynamically imported module",
        "Loading failed for the",
        "Failed to load resource",
        "net::ERR_ABORTED",
        "net::ERR_FILE_NOT_FOUND",
        "net::ERR_NAME_NOT_RESOLVED",
        "net::ERR_CONNECTION_REFUSED",
        "net::ERR_NETWORK",
        "net::ERR_INTERNET_DISCONNECTED"
      ];

      const isScriptError = 
        scriptErrorPatterns.some(pattern => event?.message?.includes(pattern)) ||
        event?.filename?.includes(".js") ||
        event?.filename?.includes(".css") ||
        event?.filename?.includes(".mjs");

      if (isScriptError) {
        console.log("Script loading error detected:", event);
        setHasChunkError(true);
      }

      detectChunkError(event.error);
    };

    const onUnhandledRejection = (event) => {
      detectChunkError(event.reason);
    };

    // Monitor network requests for 404 responses on chunk files
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      return originalFetch.apply(this, args).then(response => {
        // Check if this is a chunk file request that failed
        const url = args[0];
        if (typeof url === 'string' && 
            (url.includes('.js') || url.includes('.css') || url.includes('.mjs')) &&
            response.status === 404) {
          console.log("Chunk 404 detected:", url);
          setHasChunkError(true);
        }
        return response;
      }).catch(error => {
        // Check if this is a chunk file request that failed
        const url = args[0];
        if (typeof url === 'string' && 
            (url.includes('.js') || url.includes('.css') || url.includes('.mjs'))) {
          console.log("Chunk fetch error detected:", url, error);
          setHasChunkError(true);
        }
        throw error;
      });
    };

    // Monitor script tag loading errors
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
      const element = originalCreateElement.call(this, tagName);
      
      if (tagName.toLowerCase() === 'script') {
        const originalSetAttribute = element.setAttribute;
        element.setAttribute = function(name, value) {
          originalSetAttribute.call(this, name, value);
          
          if (name === 'src' && 
              (value.includes('.js') || value.includes('.mjs'))) {
            
            element.addEventListener('error', () => {
              console.log("Script tag error detected:", value);
              setHasChunkError(true);
            });
            
            element.addEventListener('load', () => {
              // Check if the loaded script is a 404 page (HTML instead of JS)
              if (element.src) {
                fetch(element.src)
                  .then(response => response.text())
                  .then(text => {
                    if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
                      console.log("Script returned HTML (404):", element.src);
                      setHasChunkError(true);
                    }
                  })
                  .catch(() => {
                    // Fetch failed, likely a 404
                    console.log("Script fetch failed:", element.src);
                    setHasChunkError(true);
                  });
              }
            });
          }
        };
      }
      
      return element;
    };

    // Listen for global errors
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.fetch = originalFetch;
      document.createElement = originalCreateElement;
    };
  }, []);

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

  // If there's a chunk error, show the modal overlay
  if (hasChunkError) {
    return (
      <>
        {children}
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
      </>
    );
  }

  // If no chunk error, render children normally
  return children;
}

ChunkErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
}; 