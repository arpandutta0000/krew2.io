// TODO: Make this work as a jQuery plugin or a component.
window.updateInputRange = $input => {
    let $output = $input.parent().find(`output`);

    let min = $input.attr(`min`);
    let max = $input.attr(`max`);

    let unity = (max - min) / 100;
    
    let
}