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

    if (stack) {
        let audio = document.getElementById(fileId);
        audio.loop = loop;
        audio.volume = loop ?
            volume * 0.1 * musicValue.value / musicValue.max :
            volume * 0.35 * sfxValue.value / sfxValue.max;
        let copy = audio.cloneNode(true);
        copy.play();
    } else {
        let audio = document.getElementById(fileId);
        audio.loop = loop;
        audio.volume = loop ?
            volume * 0.1 * musicValue.value / musicValue.max :
            volume * 0.45 * sfxValue.value / sfxValue.max;
        audio.play();
    }
};

/**
 * Stop an audio file
 *
 * @param {string} fileId The file ID for the audio file
 */
let stopAudioFile = (fileId) => document.getElementById(fileId).pause();