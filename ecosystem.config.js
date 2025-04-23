const { watch } = require("fs");

module.exports = {
    apps: [{
        name: "tai",
        script: "bash",
        args: "-c 'npm run build && npm run start'",
        max_memory_restart: "500M",
        watch: false,
        //watch: ["src"],
        //ignore_watch: ["node_modules", "dist"],
    }]
}