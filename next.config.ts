import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this repo. A stray lockfile in a parent directory
  // (e.g. ~) otherwise makes Turbopack infer that as the root and fail to
  // resolve `tailwindcss` from globals.css.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
