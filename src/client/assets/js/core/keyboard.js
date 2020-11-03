let keys = {
    walkLeft: false,
    walkRight: false,
    walkFwd: false,
    walkBwd: false,
    rotRight: false,
    rotLeft: false,
    jump: false,
    boot: false
}
let keyboard, disableKeyboard = false;

let setUpKeyboard = renderer => {
    let myDefaults = {
        is_unordered: true,
        prevent_repeat: true,
        prevent_default: true
    }
    keyboard = new window.keypress.Listener(document.querySelector(`body`), myDefaults);

    // Stop listening when an input or textarea is focused.
    $(`input, textarea`)
        .bind(`focus`, keyboard.stop_listening())
        .bind(`blur`, keyboard.listen());

    // Escape keybind.
    document.onkeyup = event => {
        event = event || window.event;
        if(event.key == `Escape`) if(myPlayer) myPlayer.target = undefined;
        else if(event.key == `Enter`) {
            let chat
            if(!$(`#chat-message`).is(`:focus`)) $(`#chat-message`).focus();
            else 
        }
    }
}