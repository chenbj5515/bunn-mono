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
};

export default withNextIntl(nextConfig); 