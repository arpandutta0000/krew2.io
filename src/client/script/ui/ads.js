/**
 * Checks if a user has ad block enabled
 */
let adBlockCheck = () => {
    let testAd = document.createElement(`div`);
    testAd.innerHTML = `&nbsp;`;
    testAd.className = `adsbox`;

    document.body.appendChild(testAd);
    window.setTimeout(() => {
        if (testAd.offsetHeight === 0) {
            adBlockEnabled = true;
        }
        testAd.remove();

        // Display ad block message if user has ad block enabled
        if (adBlockEnabled) {
            $(`#disable-adblock-message`).show();
        }
    }, 1000);
};

/**
 * Initiate ads
 */
let initAds = () => {
    var aiptag = aiptag || {};
    aiptag.cmd = aiptag.cmd || [];
    aiptag.cmd.display = aiptag.cmd.display || [];
    aiptag.cmd.display.push(() => {
        aipDisplayTag.display(`krew-io_300x250`);
        aipDisplayTag.display(`krew-io_300x250_2`);
    });
    aiptag.gdprShowConsentTool = true; // Show GDPR consent tool
    aiptag.gdprShowConsentToolButton = true;

    initStaticAds();
    initAipPreroll();
};

let initStaticAds = () => {
    if (typeof aiptag !== `undefined`) {
        aiptag.cmd.display.push(() => {
            aipDisplayTag.display(`krew-io_300x250`);
        });

        aiptag.cmd.display.push(() => {
            aipDisplayTag.display(`krew-io_300x250_2`);
        });
    } else console.log(`Aiptag is not defined, skipped showing static ads`);
}

/**
 * Initiate the preroll ad
 */
let initAipPreroll = () => {
    if (typeof aipPlayer !== `undefined`) {
        window.adplayerCentered = new aipPlayer({
            AD_WIDTH: 560,
            AD_HEIGHT: 315,
            AD_FULLSCREEN: false,
            PREROLL_ELEM: document.getElementById(`preroll-centered`),
            AIP_COMPLETE: () => {},
            AIP_REMOVE: () => {}
        });
    }
};

/**
 * Shows an adinplay video ad
 */
let showAdinplayCentered = () => {
    if (typeof (adplayerCentered) !== `undefined`) adplayerCentered.startPreRoll();
    else console.log(`Adplayer is not defined, skipped showing preroll ad`);
};