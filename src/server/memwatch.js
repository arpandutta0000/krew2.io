const MemwatchFactoryFunction = function (rollbar) {
    const Memwatch = require('memwatch-next');
    const util = require('util');
    const heapdump = require('heapdump');

    const countEntities = function () {
        let count = {};
        let types = ['Player', 'Boat', 'Projectile', 'Impact', 'Pickup', 'Landmark', 'Bot'];
        for (let i in core.entities) {
            let ent = core.entities[i];
            let type = types[ent.netType];
            count[type] = count[type] || 0;
            count[type] += 1;
        }

        return count;
    };

    /* Check for memory leaks */
    let hd = null;
    let oldEntities = null;
    Memwatch.on('leak', (info) => {
        if (!hd) {
            oldEntities = countEntities();
            hd = new Memwatch.HeapDiff();
            return;
        }

        let newEntities = countEntities();
        let diff = hd.end();
        if (!DEV_ENV && rollbar && rollbar.warning) {
            if (diff.after.size_bytes > 80000000) {
                heapdump.writeSnapshot(function (err, filename) {
                    console.log('dump written to', filename);
                });

                rollbar.warning('memwatch::leak', {
                    pid: process.pid,
                    info,
                    oldEntities,
                    newEntities,
                    diff,
                });
            }
        }

        hd = null;
        oldEntities = null;
    });
};

module.exports = MemwatchFactoryFunction;