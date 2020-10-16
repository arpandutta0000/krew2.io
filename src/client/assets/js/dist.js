let socket = io();

socket.on(`connect`, () => {
});

document.addEventListener(`onunload`, () => {
    socket.emit(`disconnect`);
});