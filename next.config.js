/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@distube/ytdl-core', 'fluent-ffmpeg', 'fs-extra']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        '@distube/ytdl-core': 'commonjs @distube/ytdl-core',
        'fluent-ffmpeg': 'commonjs fluent-ffmpeg',
        'fs-extra': 'commonjs fs-extra'
      })
    }
    return config
  }
}

module.exports = nextConfig 