const PlayerRestore = require(`../models/playerRestore.model.js`);

module.exports = player => new PlayerRestore({
    username: player.name,
    IP: player.socket.handshake.address,
    timestamp: new Date(),

    gold: player.gold,
    experience: player.experience,
    points: player.points,

    score: player.score,
    shipsSank: player.shipsSank,
    deaths: player.deaths ? player.deaths : 0,
    overall_kills: player.overall_kills ? player.overall_kills : 0,

    isCaptain: player.isCaptain,
    shipId: player.parent ? player.parent.captainId === player.id ? player.parent.shipclassId : undefined : undefined,

    itemId: player.itemId ? player.itemId : undefined,
    bonus: {
        fireRate: player.attackSpeedBonus,
        distance: player.attackDistanceBonus,
        damage: player.attackDamageBonus,
        speed: player.movementSpeedBonus
    },

    overallCargo: player.overall_cargo,
    otherQuestLevel: parseInt(player.other_quest_level ? player.other_quest_level : 0)
});
