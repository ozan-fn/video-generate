import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    reactCompiler: true,
    output: "export",
    compress: true,
    trailingSlash: true,
};

export default nextConfig;
