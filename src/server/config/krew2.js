module.exports = {
    apps: [{
        name: `krew2`,
        script: `../app.js`,
        node_args: `--p=443`,
        env_prod: {
            NODE_ENV: `prod`,
        }
    }]
}