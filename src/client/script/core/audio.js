/**
 * Update Music Volume
 */
let updateMusic = () => {
    let elements = document.querySelectorAll(`audio`);
    const range = document.getElementById(`music-control`);
    for (let i = 0; i < elements.length; i++) {
        elements[i].volume = 0.1 * range.value / range.max;
    }
};

/**
 * Play an audio file
 *
 * @param {boolean} loop If the audio file should be looped
 * @param {boolean} stack If the audio file should be able to be stacked
 * @param {number} volume Volume multiplier - 1 = Normal volume
 * @param {string} fileId The file ID for the audio file
 */
let playAudioFile = (loop, stack, volume, fileId) => {
    const musicValue = document.getElementById(`music-control`);
    const sfxValue = document.getElementById(`sfx-control`);

    document.getElementById(fileId).loop = loop;
    if (stack) {
        let audio = document.getElementById(fileId);

        let copy = audio.cloneNode(true);
        copy.volume = loop ? volume * 0.1 * musicValue.value / musicValue.max : volume * 0.35 * sfxValue.value / sfxValue.max;
        copy.play();
    } else {
        document.getElementById(fileId).volume = loop ? volume * 0.1 * musicValue.value / musicValue.max : volume * 0.45 * sfxValue.value / sfxValue.max;
        document.getElementById(fileId).play();
    }
};

/**
 * Stop an audio file
 *
 * @param {string} fileId The file ID for the audio file
 */
let stopAudioFile = (fileId) => document.getElementById(fileId).pause();

/**
 * Fade in an audio file
 * 
 * @param {boolean} loop If the audio file should be looped
 * @param {number} endVolume The final volume after fading in
 * @param {number} time The length of time to fade in for in milliseconds
 * @param {string} fileId The file ID for the audio file
 */
let fadeInAudio = (loop, endVolume, time, fileId) => {
    const musicValue = document.getElementById(`music-control`);
    const sfxValue = document.getElementById(`sfx-control`);

    playAudioFile(loop, false, 0, fileId);
    console.log(`fadein ${fileId}`)

    let currentTime = 0;
    let fade = setInterval(() => {
        document.getElementById(fileId).volume = Math.min(endVolume, loop ? (endVolume * (currentTime / time)) * 0.1 * musicValue.value / musicValue.max : (endVolume * (currentTime / time)) * 0.35 * sfxValue.value / sfxValue.max);
        currentTime += 50;
        if (currentTime >= time) clearInterval(fade);
    }, 50);

    document.getElementById(fileId).volume = loop ? endVolume * 0.1 * musicValue.value / musicValue.max : endVolume * 0.35 * sfxValue.value / sfxValue.max
};

/**
 * Fade out an audio file
 * 
 * @param {boolean} loop If the audio file is being looped
 * @param {number} time The length of time to fade in for in milliseconds
 * @param {string} fileId The file ID for the audio file
 */
let fadeOutAudio = (loop, time, fileId) => {
    console.log(`fadeout ${fileId}`)

    let startVolume = document.getElementById(fileId).volume;
    let currentTime = time;
    let fade = setInterval(() => {
        document.getElementById(fileId).volume = Math.max(0, loop ? (startVolume * (currentTime / time)) * 0.1 * musicValue.value / musicValue.max : (endVolume * (currentTime / time)) * 0.35 * sfxValue.value / sfxValue.max);
        currentTime -= 50;
        if (currentTime <= 0) clearInterval(fade);
    }, 50);

    stopAudioFile(fileId);
};