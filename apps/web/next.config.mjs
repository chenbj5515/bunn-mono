import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["ui"],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'i2ggfjkruhmrnyqd.public.blob.vercel-storage.com',
                pathname: '/**',
            },
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '5mb',
        },
    },
};

export default withNextIntl(nextConfig); 