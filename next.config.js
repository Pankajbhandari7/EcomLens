/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // @imgly/background-removal loads its own wasm/onnx assets at runtime via fetch,
    // no special webpack handling is required, but we keep this hook in case
    // future versions need asset copying.
    return config;
  },
};

module.exports = nextConfig;


