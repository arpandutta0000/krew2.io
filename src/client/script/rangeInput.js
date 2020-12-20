// TODO: make this work as a jQuery plugin or a component
window.updateInputRange = function ($input) {
    var $output = $input.parent().find('output');
    var min = $input.attr('min');
    var max = $input.attr('max');
    var unity = (max - min) / 100;
    var val = $input.val();
    var percent = (val - min) / unity;

    $output.html(val);
    $input.attr('style', '--value:' + percent);
    $output.attr('style', 'left:' + percent + '%; transform: translate(-' + percent + '%);');
};

window.inputRange = function ($input) {
    $input.on('input change', function () {
        updateInputRange($input);
    });

    updateInputRange($input);
};

/**
 * Example
 */

// $("input[type=range]").each(function(){
//    inputRange($(this));
// });