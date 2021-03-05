let audio = {
    musicPlaying: undefined,
    fadingIn: [],
    fadingOut: [],
    inBattle: false,

    /**
     * Update Music Volume
     */
    updateMusicVolume: () => {
        let elements = document.querySelectorAll(`audio`);
        const range = document.getElementById(`music-control`);
        for (let i = 0; i < elements.length; i++) elements[i].volume = 0.1 * range.value / range.max;
    },

    /**
     * Play an audio file
     *
     * @param {boolean} loop If the audio file should be looped
     * @param {boolean} stack If the audio file should be able to be stacked
     * @param {number} volume Volume multiplier - 1 = Normal volume
     * @param {string} fileId The file ID for the audio file
     */
    playAudioFile: (loop, stack, volume, fileId) => {
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
    },

    /**
     * Stop an audio file
     *
     * @param {string} fileId The file ID for the audio file
     */
    stopAudioFile: (fileId) => {
        document.getElementById(fileId).volume = 0;
        document.getElementById(fileId).pause();
    },

    /**
     * Fade between 2 audio files
     *
     * @param {string} oldFileId Old file ID to fade out
     * @param {string} newFileId New file ID to fade in
     * @param {number} newVolume Volume to set new audio file at
     * @param {boolean} loopNew If the new audio should be looped
     * @param {number} time Fade time
     * @returns Promise
     */
    fadeAudio: (oldFileId, newFileId, newVolume, loopNew, time) => new Promise((resolve) => {
        const musicValue = document.getElementById(`music-control`);
        const sfxValue = document.getElementById(`sfx-control`);

        audio.playAudioFile(loopNew, false, 0, newFileId);

        let currentTime = 0;
        let oldFileStartVolume = document.getElementById(oldFileId).volume;
        let fadeInterval = setInterval(() => {
            currentTime += 50;

            document.getElementById(newFileId).volume = Math.min(newVolume, loopNew ? (newVolume * (currentTime / time)) * 0.1 * musicValue.value / musicValue.max : (newVolume * (currentTime / time)) * 0.35 * sfxValue.value / sfxValue.max);
            document.getElementById(oldFileId).volume = Math.max(0, oldFileStartVolume * ((time - currentTime) / time));

            if (currentTime >= time) {
                audio.stopAudioFile(oldFileId);
                document.getElementById(newFileId).volume = loopNew ? newVolume * 0.1 * musicValue.value / musicValue.max : newVolume * 0.35 * sfxValue.value / sfxValue.max;

                resolve();
                clearInterval(fadeInterval);
            }
        }, 50);
    }),

    /**
     * Change the music playing
     *
     * @param {string} music New music to play (ocean, island, or battle)
     * @param {boolean} endBattle If music is being played after a battle is finished
     */
    changeMusic: async (music, endBattle) => {
        if (endBattle) audio.inBattle = false;

        if (!audio.inBattle) {
            let volume, newFileId;

            switch (music) {
                case `battle`: {
                    audio.inBattle = true;
                    newFileId = `battle-music`;
                    volume = 3;
                    break;
                }

                case `ocean`: {
                    if (Math.random() < 0.5) {
                        newFileId = `ocean-music`;
                        volume = 3;
                    } else {
                        newFileId = `ocean-music-2`;
                        volume = 4;
                    }

                    break;
                }

                case `island`: {
                    if (Math.random() < 0.5) {
                        newFileId = `island-music`;
                        volume = 1;
                    } else {
                        newFileId = `island-music-2`;
                        volume = 1;
                    }

                    break;
                }

                default: {
                    return;
                }
            }

            audio.fadingIn.push(newFileId);
            audio.fadingOut.push(audio.musicPlaying);

            await audio.fadeQueued(newFileId, audio.musicPlaying);

            await audio.fadeAudio(audio.musicPlaying, newFileId, volume, true, audio.inBattle ? 2e3 : 4e3);

            audio.fadingIn.shift();
            audio.fadingOut.shift();
            audio.musicPlaying = newFileId;
        }
    },

    /**
     * Function to wait for fading files to be next in the queue
     *
     * @param {string} fadingInFile File that is queued to fade in
     * @param {string} fadingOutFile File that is queued to fade out
     * @returns Promise
     */
    fadeQueued: (fadingInFile, fadingOutFile) => new Promise((resolve) => {
        let waitForFadeInterval = setInterval(() => {
            if (audio.fadingIn[0] === fadingInFile && audio.fadingOut[0] === fadingOutFile) {
                resolve();
                clearInterval(waitForFadeInterval);
            }
        }, 100);
    })
};
