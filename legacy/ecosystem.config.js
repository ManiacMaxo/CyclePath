module.exports = {
    apps: [
        {
            name: 'cyclepath-backend',
            script: './server/dist/main.js',
            env: {
                PORT: 5000,
                NODE_ENV: 'production'
            }
        }
    ]
}
