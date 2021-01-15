// Create variables
let adBlockEnabled = false;
let testAd = document.createElement(`div`);
testAd.innerHTML = `&nbsp;`;
testAd.className = `adsbox`;

/* Function to check if a user has ad block enabled */
let adBlockCheck = () => {
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

let initAds = () => {
    localStorage.setItem(`lastAdTime`, Date.now() - 10000000);

    var aiptag = aiptag || {};
    aiptag.cmd = aiptag.cmd || [];
    aiptag.cmd.display = aiptag.cmd.display || [];
    aiptag.cmd.display.push(() => {
        aipDisplayTag.display(`krew-io_300x250`);
    });
    aiptag.gdprShowConsentTool = true; // Show GDPR consent tool
    aiptag.gdprShowConsentToolButton = true;
    initAipPreroll();

    function aipGDPRCallback_OnAccept (googleConsent) {
        if (googleConsent === true) {
            initAipPreroll();
        }
    }

    function initAipPreroll () {
        // console.log("adplayer set?!");
        if (typeof aipPlayer !== `undefined`) {
            adplayer = new aipPlayer({
                AD_WIDTH: 960,
                AD_HEIGHT: 540,
                AD_FULLSCREEN: true,
                PREROLL_ELEM: document.getElementById(`preroll`),
                AIP_COMPLETE: () => {},
                AIP_REMOVE: () => {}
            });
            window.adplayerCentered = new aipPlayer({
                AD_WIDTH: 560,
                AD_HEIGHT: 315,
                AD_FULLSCREEN: false,
                PREROLL_ELEM: document.getElementById(`preroll-centered`),
                AIP_COMPLETE: () => {},
                AIP_REMOVE: () => {}
            });
        }
    }
};