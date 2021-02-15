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
 * @param {string} fileId The file ID for the audio file
 */
let playAudioFile = (loop, fileId) => {
    const musicValue = document.getElementById(`music-control`);
    const sfxValue = document.getElementById(`sfx-control`);

    document.getElementById(fileId).loop = loop;
    if (fileId === `cannon`) document.getElementById(fileId).currentTime = 0;

    document.getElementById(fileId).play();
    document.getElementById(fileId).volume = loop
        ? 0.1 * musicValue.value / musicValue.max
        : 0.45 * sfxValue.value / sfxValue.max;
};

/**
 * Stop an audio file
 *
 * @param {string} fileId The file ID for the audio file
 */
let stopAudioFile = (fileId) => document.getElementById(fileId).pause();
