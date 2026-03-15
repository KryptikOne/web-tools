import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},
					{
						key: "Permissions-Policy",
						value: "geolocation=(), microphone=(), camera=()",
					},
					{
						key: "X-DNS-Prefetch-Control",
						value: "on",
					},
				],
			},
		];
	},
	images: {
		remotePatterns: [],
	},
};

export default nextConfig;
