/**
 * When a user sends a chat message
 */
let sendMessage = () => {
    socket.emit(`chat message`, {
        message: $(`#chat-message`).val(),
        recipient: localChatOn ? `local` : clanChatOn ? `clan` : staffChatOn ? `staff` : `global`
    });
    $(`#chat-message`).val(``).focus();
};

/**
 * Function to init listeners for chat
 */
let initChatListeners = () => {
    // On a keyup in chat
    $(`#chat-message`).on(`keyup`, () => {
        let isStaff = config.Admins.includes(myPlayer.name) || config.Mods.includes(myPlayer.name) || config.Helpers.includes(myPlayer.name) || config.Designers.includes(myPlayer.name);
        if (isStaff) $(`#chat-message`).prop(`maxlength`, 1e3);

        if ($(`#chat-message`).val().trim().length > (isStaff ? 1e3 : 150)) {
            $(`#chat-message`).val($(`#chat-message`).val().slice(0, (isStaff ? 1e3 : 150)));
        }
    });

    // Send chat message on enter
    $(`#chat-message`).on(`keypress`, (e) => {
        if (e.keyCode === 13) {
            sendMessage();
        }
    });

    // Init other chat buttons
    $(`#chat-global`).on(`click`, () => {
        toggleGlobalChat();
    });
    $(`#chat-local`).on(`click`, () => {
        toggleLocalChat();
    });
    $(`#chat-clan`).on(`click`, () => {
        toggleClanChat();
    });
    $(`#chat-staff`).on(`click`, () => {
        toggleStaffChat();
    });
    $(`#hide-chat`).on(`click`, () => {
        $(`#show-chat`).show();
        $(`#chat-div`).hide();
    });
    $(`#show-chat`).on(`click`, () => {
        $(`#show-chat`).hide();
        $(`#chat-div`).show();
    });
};

/**
 * Show global chat
 */
let toggleGlobalChat = () => {
    $(`#chat-global`).addClass(`active`);
    $(`#chat-local`).removeClass(`active`);
    $(`#chat-clan`).removeClass(`active`);
    $(`#chat-staff`).removeClass(`active`);

    $(`.global-chat`).show();
    $(`.local-chat`).hide();
    $(`.clan-chat`).hide();
    $(`.staff-chat`).hide();
    staffChatOn = false;
    clanChatOn = false;
    localChatOn = false;
    globalChatOn = true;
    $(`#global-chat-alert`).hide();
};

/**
 * Show local chat
 */
let toggleLocalChat = () => {
    $(`#chat-global`).removeClass(`active`);
    $(`#chat-clan`).removeClass(`active`);
    $(`#chat-local`).addClass(`active`);
    $(`#chat-staff`).removeClass(`active`);

    $(`.global-chat`).hide();
    $(`.local-chat`).show();
    $(`.clan-chat`).hide();
    $(`.staff-chat`).hide();
    staffChatOn = false;
    clanChatOn = false;
    localChatOn = true;
    globalChatOn = false;
    $(`#local-chat-alert`).hide();
};

/**
 * Show clan chat
 */
let toggleClanChat = () => {
    $(`#chat-global`).removeClass(`active`);
    $(`#chat-local`).removeClass(`active`);
    $(`#chat-clan`).addClass(`active`);
    $(`#chat-staff`).removeClass(`active`);

    $(`.global-chat`).hide();
    $(`.local-chat`).hide();
    $(`.clan-chat`).show();
    $(`.staff-chat`).hide();
    staffChatOn = false;
    clanChatOn = true;
    localChatOn = false;
    globalChatOn = false;
    $(`#clan-chat-alert`).hide();
};

/**
 * Show staff chat
 */
let toggleStaffChat = () => {
    $(`#chat-global`).removeClass(`active`);
    $(`#chat-local`).removeClass(`active`);
    $(`#chat-clan`).removeClass(`active`);
    $(`#chat-staff`).addClass(`active`);

    $(`.global-chat`).hide();
    $(`.local-chat`).hide();
    $(`.clan-chat`).hide();
    $(`.staff-chat`).show();
    staffChatOn = true;
    clanChatOn = false;
    localChatOn = false;
    globalChatOn = false;
    $(`#staff-chat-alert`).hide();
};

/**
 * Initiate chat scroll
 */
let scrollChatInit = () => {
    chatHistory = document.querySelector(`#chat-history`);
    stoppedScroll = false;

    chatHistory.scrollTop = 0;
    PreviousScrollTop = 0;

    scrollLoop = setInterval(scrollChat, 1);
};

/**
 * Display an incoming chat message
 *
 * @param {object} msgData Message data
 */
let displayMessage = (msgData) => {
    if (
        myPlayer &&
        myPlayer.parent &&
        (myPlayer.parent.hasChild(msgData.playerId) ||
            msgData.recipient === `global` ||
            msgData.recipient === `local` ||
            msgData.recipient === `clan` ||
            msgData.recipient === `staff`) &&
        entities[msgData.playerId] !== undefined
    ) {
        let classRec = `global-chat`;
        let chatHistory = $(`#chat-history`);
        if (msgData.recipient === `global`) classRec = `global-chat`;
        else if (msgData.recipient === `local`) classRec = `local-chat`;
        else if (msgData.recipient === `staff`) classRec = `staff-chat`;
        else classRec = `clan-chat`;

        let hasBoats = myPlayer !== undefined && myPlayer.parent !== undefined && myPlayer.parent.netType === 1 && entities[msgData.playerId].parent !== undefined && entities[msgData.playerId].parent.netType === 1;
        let isAdmin = config.Admins.includes(msgData.playerName);
        let isMod = config.Mods.includes(msgData.playerName);
        let isHelper = config.Helpers.includes(msgData.playerName);
        let isDesigner = config.Designers.includes(msgData.playerName);
        let isPlayer = msgData.playerId === myPlayerId;
        let isClanMember = myPlayer.clan !== `` && myPlayer.clan !== undefined && myPlayer.clan === entities[msgData.playerId].clan && !isPlayer;
        let isCaptain = hasBoats && myPlayer.parent.id === entities[msgData.playerId].parent.id && entities[myPlayer.parent.id].captainId === msgData.playerId;
        let isKrewmate = hasBoats && myPlayer.parent.id === entities[msgData.playerId].parent.id;

        let playerColor;
        if (isAdmin) playerColor = `admin-color`;
        else if (isMod) playerColor = `mod-color`;
        else if (isHelper) playerColor = `helper-color`;
        else if (isDesigner) playerColor = `designer-color`;
        else if (isPlayer) playerColor = `myself-color`;
        else if (isClanMember) playerColor = `clan-color`;
        else if (isCaptain) playerColor = `captain-color`;
        else if (isKrewmate) playerColor = `krewmate-color`;
        else playerColor = `white`;

        let $msgDiv = $(`<div/>`, {
            text: `${(msgData.playerClan ? `[${msgData.playerClan}] ` : ``) +
                (isAdmin ? `[Admin] ` : isMod ? `[Mod] ` : isHelper ? `[Helper] ` : isDesigner ? `[Designer] ` : ``) +
                msgData.playerName
            }: ${
                msgData.message}`,
            class: `${classRec
            } text-${playerColor}`
        });

        let messageTypes = [`staff-chat`, `clan-chat`, `local-chat`, `global-chat`];
        for (let i = 0; i < messageTypes.length; i++) {
            let messageType = messageTypes[i];

            let messageCount = $(`.${messageType}`).length;
            if (messageCount > 15) {
                $(`.${messageType}`)
                    .first()
                    .remove();
            }
        }

        if (msgData.recipient === `global` && !globalChatOn) {
            $(`#global-chat-alert`).show();
            $msgDiv.hide();
        }

        if (msgData.recipient === `local` && !localChatOn) {
            $(`#local-chat-alert`).show();
            $msgDiv.hide();
        }

        if (msgData.recipient === `clan` && !clanChatOn) {
            $(`#clan-chat-alert`).show();
            $msgDiv.hide();
        }
        if (msgData.recipient === `staff` && !staffChatOn) {
            $(`#staff-chat-alert`).show();
            $msgDiv.hide();
        }

        let atTheBottom = false;
        if (
            $(chatHistory).scrollTop() + $(chatHistory).innerHeight() >=
            $(chatHistory)[0].scrollHeight
        ) {
            atTheBottom = true;
        }

        chatHistory.append($msgDiv);

        if (atTheBottom === true) {
            chatHistory.scrollTop(function () {
                return this.scrollHeight;
            });
        }
    }
};

/**
 * Scroll the chat
 */
let scrollChat = () => {
    chatHistory.scrollTop = PreviousScrollTop;
    PreviousScrollTop += 0.25;

    stoppedScroll = chatHistory.scrollTop >= (chatHistory.scrollHeight - chatHistory.offsetHeight);
};

let pauseChat = () => {
    clearInterval(scrollLoop);
};

let resumeChat = () => {
    PreviousScrollTop = chatHistory.scrollTop;
    scrollLoop = setInterval(scrollChat, 1);
};

scrollChatInit();
chatHistory.addEventListener(`mouseover`, pauseChat);
chatHistory.addEventListener(`mouseout`, resumeChat);
