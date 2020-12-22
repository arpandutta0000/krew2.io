module.exports = {
    apps: [{
        name: `krew2`,
        script: `./src/server/app.js`,
        out_file: `./logs/outlog`,
        error_file: `./logs/err.log`,
        env_prod: {
            NODE_ENV: `prod`,
        }
    }]
}