let ProjectileDelta = {
    /**
     * Get a projectile's delta type
     *
     * @param {object} _this Projectile object
     */
    getTypeDelta: (_this) => {
        if (!_this.spawnPacket) _this.spawnPacket = true;
        return undefined;
    }
};
