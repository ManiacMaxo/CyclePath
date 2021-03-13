module.exports = {
    name: 'CyclePath frontend',
    script: 'serve',
    watch: true,
    env: {
        PM2_SERVE_PATH: './build',
        PM2_SERVE_PORT: 3000,
        NODE_ENV: 'production'
    }
}