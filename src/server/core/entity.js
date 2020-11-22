const Entity = () => {}

Entity.prototype.createProperties = () => {
    // Each and every thing in the game has a position and a velocity.
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
}