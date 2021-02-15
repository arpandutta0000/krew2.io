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
        if ($(`#chat-message`).val().trim().length > 150) {
            $(`#chat-message`).val($(`#chat-message`).val().slice(0, 150));
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
