// Initialize leaflet icons only on client side
export const initializeLeafletIcons = () => {
  if (typeof window === "undefined") return;

  // Dynamic import only when we know we're on the client
  import("leaflet").then((L) => {
    // Set default icon paths
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "/marker-icon-2x.png",
      iconUrl: "/marker-icon.png",
      shadowUrl: "/marker-shadow.png",
    });
  });
};

// Create custom icon for athletes - client side only
export const createCustomIcon = (color: string, label: string = "") => {
  if (typeof window === "undefined") return null;

  // Use require only on client side to avoid SSR issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const L = (window as any).L || require("leaflet");

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        color: white;
      ">${label}</div>
    `,
    className: "custom-div-icon",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};
