import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Old routes from before the tab bar (docs/ui.md), kept so bookmarks still work.
  async redirects() {
    return [
      { source: "/dashboard", destination: "/", permanent: false },
      { source: "/expenses", destination: "/transactions", permanent: false },
    ];
  },
};

export default nextConfig;
