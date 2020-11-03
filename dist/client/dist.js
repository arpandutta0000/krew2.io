/*jslint browser: true, regexp: true, maxerr: 50, indent: 4 */
/**
 * A UserAgent detection library.
 *
 * This library relies on the navigator.userAgent property and hence does not
 * work for custom UserAgent settings.
 *
 * Apart from supporting detection of major browser vendors, the library also
 * supports detection of various devices.
 *
 * Copyright (c) 2012-2014, Gopalarathnam Venkatesan
 * All rights reserved.
 *
 * @module UA
 */
(function (window, navigator) {
    'use strict';

    var userAgent = (window.navigator && navigator.userAgent) || '';

    function detect(pattern) {
        return function () {
            return (pattern).test(userAgent);
        };
    }

    var UA =  {
        /**
         * Return true if the browser is Chrome or compatible.
         *
         * @method isChrome
         */
        isChrome: detect(/webkit\W.*(chrome|chromium)\W/i),

        /**
         * Return true if the browser is Firefox.
         *
         * @method isFirefox
         */
        isFirefox: detect(/mozilla.*\Wfirefox\W/i),

        /**
         * Return true if the browser is using the Gecko engine.
         *
         * This is probably a better way to identify Firefox and other browsers
         * that use XulRunner.
         *
         * @method isGecko
         */
        isGecko: detect(/mozilla(?!.*webkit).*\Wgecko\W/i),

        /**
         * Return true if the browser is Internet Explorer.
         *
         * @method isIE
         */
        isIE: function () {
            if (navigator.appName === 'Microsoft Internet Explorer') {
                return true;
            } else if (detect(/\bTrident\b/)) {
                return true;
            } else {
                return false;
            }
        },


        /**
         * Return true if the browser is running on Kindle.
         *
         * @method isKindle
         */
        isKindle: detect(/\W(kindle|silk)\W/i),

        /**
         * Return true if the browser is running on a mobile device.
         *
         * @method isMobile
         */
        isMobile: detect(/(iphone|ipod|((?:android)?.*?mobile)|blackberry|nokia)/i),

        /**
         * Return true if we are running on Opera.
         *
         * @method isOpera
         */
        isOpera: detect(/opera.*\Wpresto\W|OPR/i),

        /**
         * Return true if the browser is Safari.
         *
         * @method isSafari
         */
        isSafari: detect(/webkit\W(?!.*chrome).*safari\W/i),

        /**
         * Return true if the browser is running on a tablet.
         *
         * One way to distinguish Android mobiles from tablets is that the
         * mobiles contain the string "mobile" in their UserAgent string.
         * If the word "Android" isn't followed by "mobile" then its a
         * tablet.
         *
         * @method isTablet
         */
        isTablet: detect(/(ipad|android(?!.*mobile)|tablet)/i),

        /**
         * Return true if the browser is running on a TV!
         *
         * @method isTV
         */
        isTV: detect(/googletv|sonydtv/i),

        /**
         * Return true if the browser is running on a WebKit browser.
         *
         * @method isWebKit
         */
        isWebKit: detect(/webkit\W/i),

        /**
         * Return true if the browser is running on an Android browser.
         *
         * @method isAndroid
         */
        isAndroid: detect(/android/i),

        /**
         * Return true if the browser is running on any iOS device.
         *
         * @method isIOS
         */
        isIOS: detect(/(ipad|iphone|ipod)/i),

        /**
         * Return true if the browser is running on an iPad.
         *
         * @method isIPad
         */
        isIPad: detect(/ipad/i),

        /**
         * Return true if the browser is running on an iPhone.
         *
         * @method isIPhone
         */
        isIPhone: detect(/iphone/i),

        /**
         * Return true if the browser is running on an iPod touch.
         *
         * @method isIPod
         */
        isIPod: detect(/ipod/i),

        /**
         * Return the complete UserAgent string verbatim.
         *
         * @method whoami
         */
        whoami: function () {
            return userAgent;
        },
    };

    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], function () {
            return UA;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = UA.attach;
        module.exports.UA = UA;
    } else {
        // browser global
        window.UA = UA;
    }

}(window, navigator));

/*
  Keypress version 2.1.4 (c) 2016 David Mauro.
  Licensed under the Apache License, Version 2.0
  http://www.apache.org/licenses/LICENSE-2.0
*/
(function(){var m,v,y,z,A,r,w,B,F,C,G,H,q,s,p,o,t,D,I,E={}.hasOwnProperty,j=[].indexOf||function(a){for(var c=0,b=this.length;c<b;c++)if(c in this&&this[c]===a)return c;return-1};r={is_unordered:!1,is_counting:!1,is_exclusive:!1,is_solitary:!1,prevent_default:!1,prevent_repeat:!1};D="meta alt option ctrl shift cmd".split(" ");o="ctrl";m={debug:!1};var x=function(a){var c,b;for(c in a)E.call(a,c)&&(b=a[c],!1!==b&&(this[c]=b));this.keys=this.keys||[];this.count=this.count||0};x.prototype.allows_key_repeat=
function(){return!this.prevent_repeat&&"function"===typeof this.on_keydown};x.prototype.reset=function(){this.count=0;return this.keyup_fired=null};var g=function(a,c){var b,d;"undefined"!==typeof jQuery&&null!==jQuery&&a instanceof jQuery&&(1!==a.length&&p("Warning: your jQuery selector should have exactly one object."),a=a[0]);this.should_force_event_defaults=this.should_suppress_event_defaults=!1;this.sequence_delay=800;this._registered_combos=[];this._keys_down=[];this._active_combos=[];this._sequence=
[];this._sequence_timer=null;this._prevent_capture=!1;this._defaults=c||{};for(b in r)E.call(r,b)&&(d=r[b],this._defaults[b]=this._defaults[b]||d);this.element=a||document.body;b=function(a,b,c){a.addEventListener?a.addEventListener(b,c):a.attachEvent&&a.attachEvent("on"+b,c);return c};var e=this;this.keydown_event=b(this.element,"keydown",function(a){a=a||window.event;e._receive_input(a,true);return e._bug_catcher(a)});var f=this;this.keyup_event=b(this.element,"keyup",function(a){a=a||window.event;
return f._receive_input(a,false)});var h=this;this.blur_event=b(window,"blur",function(){var a,b,c,d;d=h._keys_down;b=0;for(c=d.length;b<c;b++){a=d[b];h._key_up(a,{})}return h._keys_down=[]})};g.prototype.destroy=function(){var a;a=function(a,b,d){if(null!=a.removeEventListener)return a.removeEventListener(b,d);if(null!=a.removeEvent)return a.removeEvent("on"+b,d)};a(this.element,"keydown",this.keydown_event);a(this.element,"keyup",this.keyup_event);return a(window,"blur",this.blur_event)};g.prototype._bug_catcher=
function(a){var c,b;if("cmd"===o&&0<=j.call(this._keys_down,"cmd")&&"cmd"!==(c=z(null!=(b=a.keyCode)?b:a.key))&&"shift"!==c&&"alt"!==c&&"caps"!==c&&"tab"!==c)return this._receive_input(a,!1)};g.prototype._cmd_bug_check=function(a){return"cmd"===o&&0<=j.call(this._keys_down,"cmd")&&0>j.call(a,"cmd")?!1:!0};g.prototype._prevent_default=function(a,c){if((c||this.should_suppress_event_defaults)&&!this.should_force_event_defaults)if(a.preventDefault?a.preventDefault():a.returnValue=!1,a.stopPropagation)return a.stopPropagation()};
g.prototype._get_active_combos=function(a){var c,b;c=[];b=w(this._keys_down,function(b){return b!==a});b.push(a);this._match_combo_arrays(b,function(a){return function(b){if(a._cmd_bug_check(b.keys))return c.push(b)}}(this));this._fuzzy_match_combo_arrays(b,function(a){return function(b){if(!(0<=j.call(c,b))&&!b.is_solitary&&a._cmd_bug_check(b.keys))return c.push(b)}}(this));return c};g.prototype._get_potential_combos=function(a){var c,b,d,e,f;b=[];f=this._registered_combos;d=0;for(e=f.length;d<e;d++)c=
f[d],c.is_sequence||0<=j.call(c.keys,a)&&this._cmd_bug_check(c.keys)&&b.push(c);return b};g.prototype._add_to_active_combos=function(a){var c,b,d,e,f,h,i,g,n,k,l;h=!1;f=!0;d=!1;if(0<=j.call(this._active_combos,a))return!0;if(this._active_combos.length){e=i=0;for(k=this._active_combos.length;0<=k?i<k:i>k;e=0<=k?++i:--i)if((c=this._active_combos[e])&&c.is_exclusive&&a.is_exclusive){c=c.keys;if(!h){g=0;for(n=c.length;g<n;g++)if(b=c[g],h=!0,0>j.call(a.keys,b)){h=!1;break}}if(f&&!h){l=a.keys;g=0;for(n=
l.length;g<n;g++)if(b=l[g],f=!1,0>j.call(c,b)){f=!0;break}}h&&(d?(c=this._active_combos.splice(e,1)[0],null!=c&&c.reset()):(c=this._active_combos.splice(e,1,a)[0],null!=c&&c.reset(),d=!0),f=!1)}}f&&this._active_combos.unshift(a);return h||f};g.prototype._remove_from_active_combos=function(a){var c,b,d,e;b=d=0;for(e=this._active_combos.length;0<=e?d<e:d>e;b=0<=e?++d:--d)if(c=this._active_combos[b],c===a){a=this._active_combos.splice(b,1)[0];a.reset();break}};g.prototype._get_possible_sequences=function(){var a,
c,b,d,e,f,h,i,g,n,k,l;d=[];n=this._registered_combos;f=0;for(g=n.length;f<g;f++){a=n[f];c=h=1;for(k=this._sequence.length;1<=k?h<=k:h>=k;c=1<=k?++h:--h)if(e=this._sequence.slice(-c),a.is_sequence){if(0>j.call(a.keys,"shift")&&(e=w(e,function(a){return"shift"!==a}),!e.length))continue;c=i=0;for(l=e.length;0<=l?i<l:i>l;c=0<=l?++i:--i)if(a.keys[c]===e[c])b=!0;else{b=!1;break}b&&d.push(a)}}return d};g.prototype._add_key_to_sequence=function(a,c){var b,d,e,f;this._sequence.push(a);d=this._get_possible_sequences();
if(d.length){e=0;for(f=d.length;e<f;e++)b=d[e],this._prevent_default(c,b.prevent_default);this._sequence_timer&&clearTimeout(this._sequence_timer);-1<this.sequence_delay&&(this._sequence_timer=setTimeout(function(){return this._sequence=[]},this.sequence_delay))}else this._sequence=[]};g.prototype._get_sequence=function(a){var c,b,d,e,f,h,i,g,n,k,l,u;k=this._registered_combos;h=0;for(n=k.length;h<n;h++)if(c=k[h],c.is_sequence){b=i=1;for(l=this._sequence.length;1<=l?i<=l:i>=l;b=1<=l?++i:--i)if(f=w(this._sequence,
function(a){return 0<=j.call(c.keys,"shift")?!0:"shift"!==a}).slice(-b),c.keys.length===f.length){b=g=0;for(u=f.length;0<=u?g<u:g>u;b=0<=u?++g:--g)if(e=f[b],!(0>j.call(c.keys,"shift")&&"shift"===e)&&!("shift"===a&&0>j.call(c.keys,"shift")))if(c.keys[b]===e)d=!0;else{d=!1;break}}if(d)return c.is_exclusive&&(this._sequence=[]),c}return!1};g.prototype._receive_input=function(a,c){var b,d;if(this._prevent_capture)this._keys_down.length&&(this._keys_down=[]);else if(b=z(null!=(d=a.keyCode)?d:a.key),(c||
this._keys_down.length||!("alt"===b||b===o))&&b)return c?this._key_down(b,a):this._key_up(b,a)};g.prototype._fire=function(a,c,b,d){"function"===typeof c["on_"+a]&&this._prevent_default(b,!0!==c["on_"+a].call(c["this"],b,c.count,d));"release"===a&&(c.count=0);if("keyup"===a)return c.keyup_fired=!0};g.prototype._match_combo_arrays=function(a,c){var b,d,e,f;f=this._registered_combos;d=0;for(e=f.length;d<e;d++)b=f[d],(!b.is_unordered&&y(a,b.keys)||b.is_unordered&&v(a,b.keys))&&c(b)};g.prototype._fuzzy_match_combo_arrays=
function(a,c){var b,d,e,f;f=this._registered_combos;d=0;for(e=f.length;d<e;d++)b=f[d],(!b.is_unordered&&C(b.keys,a)||b.is_unordered&&F(b.keys,a))&&c(b)};g.prototype._keys_remain=function(a){var c,b,d,e;e=a.keys;b=0;for(d=e.length;b<d;b++)if(a=e[b],0<=j.call(this._keys_down,a)){c=!0;break}return c};g.prototype._key_down=function(a,c){var b,d,e,f,h;(b=A(a,c))&&(a=b);this._add_key_to_sequence(a,c);(b=this._get_sequence(a))&&this._fire("keydown",b,c);for(e in t)b=t[e],c[b]&&(e===a||0<=j.call(this._keys_down,
e)||this._keys_down.push(e));for(e in t)if(b=t[e],e!==a&&0<=j.call(this._keys_down,e)&&!c[b]&&!("cmd"===e&&"cmd"!==o)){b=d=0;for(f=this._keys_down.length;0<=f?d<f:d>f;b=0<=f?++d:--d)this._keys_down[b]===e&&this._keys_down.splice(b,1)}d=this._get_active_combos(a);e=this._get_potential_combos(a);f=0;for(h=d.length;f<h;f++)b=d[f],this._handle_combo_down(b,e,a,c);if(e.length){d=0;for(f=e.length;d<f;d++)b=e[d],this._prevent_default(c,b.prevent_default)}0>j.call(this._keys_down,a)&&this._keys_down.push(a)};
g.prototype._handle_combo_down=function(a,c,b,d){var e,f,h,g,m;if(0>j.call(a.keys,b))return!1;this._prevent_default(d,a&&a.prevent_default);e=!1;if(0<=j.call(this._keys_down,b)&&(e=!0,!a.allows_key_repeat()))return!1;h=this._add_to_active_combos(a,b);b=a.keyup_fired=!1;if(a.is_exclusive){g=0;for(m=c.length;g<m;g++)if(f=c[g],f.is_exclusive&&f.keys.length>a.keys.length){b=!0;break}}if(!b&&(a.is_counting&&"function"===typeof a.on_keydown&&(a.count+=1),h))return this._fire("keydown",a,d,e)};g.prototype._key_up=
function(a,c){var b,d,e,f,h,g;b=a;(e=A(a,c))&&(a=e);e=s[b];c.shiftKey?e&&0<=j.call(this._keys_down,e)||(a=b):b&&0<=j.call(this._keys_down,b)||(a=e);(f=this._get_sequence(a))&&this._fire("keyup",f,c);if(0>j.call(this._keys_down,a))return!1;f=h=0;for(g=this._keys_down.length;0<=g?h<g:h>g;f=0<=g?++h:--h)if((d=this._keys_down[f])===a||d===e||d===b){this._keys_down.splice(f,1);break}d=this._active_combos.length;e=[];g=this._active_combos;f=0;for(h=g.length;f<h;f++)b=g[f],0<=j.call(b.keys,a)&&e.push(b);
f=0;for(h=e.length;f<h;f++)b=e[f],this._handle_combo_up(b,c,a);if(1<d){h=this._active_combos;d=0;for(f=h.length;d<f;d++)b=h[d],void 0===b||0<=j.call(e,b)||this._keys_remain(b)||this._remove_from_active_combos(b)}};g.prototype._handle_combo_up=function(a,c,b){var d,e;this._prevent_default(c,a&&a.prevent_default);e=this._keys_remain(a);if(!a.keyup_fired&&(d=this._keys_down.slice(),d.push(b),!a.is_solitary||v(d,a.keys)))this._fire("keyup",a,c),a.is_counting&&("function"===typeof a.on_keyup&&"function"!==
typeof a.on_keydown)&&(a.count+=1);e||(this._fire("release",a,c),this._remove_from_active_combos(a))};g.prototype.simple_combo=function(a,c){return this.register_combo({keys:a,on_keydown:c})};g.prototype.counting_combo=function(a,c){return this.register_combo({keys:a,is_counting:!0,is_unordered:!1,on_keydown:c})};g.prototype.sequence_combo=function(a,c){return this.register_combo({keys:a,on_keydown:c,is_sequence:!0,is_exclusive:!0})};g.prototype.register_combo=function(a){var c,b,d;"string"===typeof a.keys&&
(a.keys=a.keys.split(" "));d=this._defaults;for(c in d)E.call(d,c)&&(b=d[c],void 0===a[c]&&(a[c]=b));a=new x(a);if(I(a))return this._registered_combos.push(a),a};g.prototype.register_many=function(a){var c,b,d,e;e=[];b=0;for(d=a.length;b<d;b++)c=a[b],e.push(this.register_combo(c));return e};g.prototype.unregister_combo=function(a){var c,b,d,e,f,g;if(!a)return!1;var i=this;b=function(a){var b,c,d,e;e=[];b=c=0;for(d=i._registered_combos.length;0<=d?c<d:c>d;b=0<=d?++c:--c)if(a===i._registered_combos[b]){i._registered_combos.splice(b,
1);break}else e.push(void 0);return e};if(a instanceof x)return b(a);"string"===typeof a&&(a=a.split(" "));f=this._registered_combos;g=[];d=0;for(e=f.length;d<e;d++)c=f[d],null!=c&&(c.is_unordered&&v(a,c.keys)||!c.is_unordered&&y(a,c.keys)?g.push(b(c)):g.push(void 0));return g};g.prototype.unregister_many=function(a){var c,b,d,e;e=[];b=0;for(d=a.length;b<d;b++)c=a[b],e.push(this.unregister_combo(c));return e};g.prototype.get_registered_combos=function(){return this._registered_combos};g.prototype.reset=
function(){return this._registered_combos=[]};g.prototype.listen=function(){return this._prevent_capture=!1};g.prototype.stop_listening=function(){return this._prevent_capture=!0};g.prototype.get_meta_key=function(){return o};m.Listener=g;z=function(a){return q[a]};w=function(a,c){var b;if(a.filter)return a.filter(c);var d,e,f;f=[];d=0;for(e=a.length;d<e;d++)b=a[d],c(b)&&f.push(b);return f};v=function(a,c){var b,d,e;if(a.length!==c.length)return!1;d=0;for(e=a.length;d<e;d++)if(b=a[d],!(0<=j.call(c,
b)))return!1;return!0};y=function(a,c){var b,d,e;if(a.length!==c.length)return!1;b=d=0;for(e=a.length;0<=e?d<e:d>e;b=0<=e?++d:--d)if(a[b]!==c[b])return!1;return!0};F=function(a,c){var b,d,e;d=0;for(e=a.length;d<e;d++)if(b=a[d],0>j.call(c,b))return!1;return!0};B=Array.prototype.indexOf||function(a,c){var b,d,e;b=d=0;for(e=a.length;0<=e?d<=e:d>=e;b=0<=e?++d:--d)if(a[b]===c)return b;return-1};C=function(a,c){var b,d,e,f;e=d=0;for(f=a.length;e<f;e++)if(b=a[e],b=B.call(c,b),b>=d)d=b;else return!1;return!0};
p=function(){if(m.debug)return console.log.apply(console,arguments)};G=function(a){var c,b,d;c=!1;for(d in q)if(b=q[d],a===b){c=!0;break}if(!c)for(d in s)if(b=s[d],a===b){c=!0;break}return c};I=function(a){var c,b,d,e,f,g,i;f=!0;a.keys.length||p("You're trying to bind a combo with no keys:",a);b=g=0;for(i=a.keys.length;0<=i?g<i:g>i;b=0<=i?++g:--g)d=a.keys[b],(c=H[d])&&(d=a.keys[b]=c),"meta"===d&&a.keys.splice(b,1,o),"cmd"===d&&p('Warning: use the "meta" key rather than "cmd" for Windows compatibility');
i=a.keys;c=0;for(g=i.length;c<g;c++)d=i[c],G(d)||(p('Do not recognize the key "'+d+'"'),f=!1);if(0<=j.call(a.keys,"meta")||0<=j.call(a.keys,"cmd")){c=a.keys.slice();g=0;for(i=D.length;g<i;g++)d=D[g],-1<(b=B.call(c,d))&&c.splice(b,1);1<c.length&&(p("META and CMD key combos cannot have more than 1 non-modifier keys",a,c),f=!1)}for(e in a)"undefined"===r[e]&&p("The property "+e+" is not a valid combo property. Your combo has still been registered.");return f};A=function(a,c){var b;if(!c.shiftKey)return!1;
b=s[a];return null!=b?b:!1};t={cmd:"metaKey",ctrl:"ctrlKey",shift:"shiftKey",alt:"altKey"};H={escape:"esc",control:"ctrl",command:"cmd","break":"pause",windows:"cmd",option:"alt",caps_lock:"caps",apostrophe:"'",semicolon:";",tilde:"~",accent:"`",scroll_lock:"scroll",num_lock:"num"};s={"/":"?",".":">",",":"<","'":'"',";":":","[":"{","]":"}","\\":"|","`":"~","=":"+","-":"_",1:"!",2:"@",3:"#",4:"$",5:"%",6:"^",7:"&",8:"*",9:"(","0":")"};q={"0":"\\",8:"backspace",9:"tab",12:"num",13:"enter",16:"shift",
17:"ctrl",18:"alt",19:"pause",20:"caps",27:"esc",32:"space",33:"pageup",34:"pagedown",35:"end",36:"home",37:"left",38:"up",39:"right",40:"down",44:"print",45:"insert",46:"delete",48:"0",49:"1",50:"2",51:"3",52:"4",53:"5",54:"6",55:"7",56:"8",57:"9",65:"a",66:"b",67:"c",68:"d",69:"e",70:"f",71:"g",72:"h",73:"i",74:"j",75:"k",76:"l",77:"m",78:"n",79:"o",80:"p",81:"q",82:"r",83:"s",84:"t",85:"u",86:"v",87:"w",88:"x",89:"y",90:"z",91:"cmd",92:"cmd",93:"cmd",96:"num_0",97:"num_1",98:"num_2",99:"num_3",
100:"num_4",101:"num_5",102:"num_6",103:"num_7",104:"num_8",105:"num_9",106:"num_multiply",107:"num_add",108:"num_enter",109:"num_subtract",110:"num_decimal",111:"num_divide",112:"f1",113:"f2",114:"f3",115:"f4",116:"f5",117:"f6",118:"f7",119:"f8",120:"f9",121:"f10",122:"f11",123:"f12",124:"print",144:"num",145:"scroll",186:";",187:"=",188:",",189:"-",190:".",191:"/",192:"`",219:"[",220:"\\",221:"]",222:"'",223:"`",224:"cmd",225:"alt",57392:"ctrl",63289:"num",59:";",61:"=",173:"-"};m._keycode_dictionary=
q;m._is_array_in_array_sorted=C;-1!==navigator.userAgent.indexOf("Mac OS X")&&(o="cmd");-1!==navigator.userAgent.indexOf("Opera")&&(q["17"]="cmd");"function"===typeof define&&define.amd?define([],function(){return m}):"undefined"!==typeof exports&&null!==exports?exports.keypress=m:window.keypress=m}).call(this);

/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.OBJLoader = ( function () {

	// o object_name | g group_name
	var object_pattern           = /^[og]\s*(.+)?/;
	// mtllib file_reference
	var material_library_pattern = /^mtllib /;
	// usemtl material_name
	var material_use_pattern     = /^usemtl /;

	function ParserState() {

		var state = {
			objects  : [],
			object   : {},

			vertices : [],
			normals  : [],
			uvs      : [],

			materialLibraries : [],

			startObject: function ( name, fromDeclaration ) {

				// If the current object (initial from reset) is not from a g/o declaration in the parsed
				// file. We need to use it for the first parsed g/o to keep things in sync.
				if ( this.object && this.object.fromDeclaration === false ) {

					this.object.name = name;
					this.object.fromDeclaration = ( fromDeclaration !== false );
					return;

				}

				var previousMaterial = ( this.object && typeof this.object.currentMaterial === 'function' ? this.object.currentMaterial() : undefined );

				if ( this.object && typeof this.object._finalize === 'function' ) {

					this.object._finalize( true );

				}

				this.object = {
					name : name || '',
					fromDeclaration : ( fromDeclaration !== false ),

					geometry : {
						vertices : [],
						normals  : [],
						uvs      : []
					},
					materials : [],
					smooth : true,

					startMaterial: function ( name, libraries ) {

						var previous = this._finalize( false );

						// New usemtl declaration overwrites an inherited material, except if faces were declared
						// after the material, then it must be preserved for proper MultiMaterial continuation.
						if ( previous && ( previous.inherited || previous.groupCount <= 0 ) ) {

							this.materials.splice( previous.index, 1 );

						}

						var material = {
							index      : this.materials.length,
							name       : name || '',
							mtllib     : ( Array.isArray( libraries ) && libraries.length > 0 ? libraries[ libraries.length - 1 ] : '' ),
							smooth     : ( previous !== undefined ? previous.smooth : this.smooth ),
							groupStart : ( previous !== undefined ? previous.groupEnd : 0 ),
							groupEnd   : -1,
							groupCount : -1,
							inherited  : false,

							clone: function ( index ) {
								var cloned = {
									index      : ( typeof index === 'number' ? index : this.index ),
									name       : this.name,
									mtllib     : this.mtllib,
									smooth     : this.smooth,
									groupStart : 0,
									groupEnd   : -1,
									groupCount : -1,
									inherited  : false
								};
								cloned.clone = this.clone.bind(cloned);
								return cloned;
							}
						};

						this.materials.push( material );

						return material;

					},

					currentMaterial: function () {

						if ( this.materials.length > 0 ) {
							return this.materials[ this.materials.length - 1 ];
						}

						return undefined;

					},

					_finalize: function ( end ) {

						var lastMultiMaterial = this.currentMaterial();
						if ( lastMultiMaterial && lastMultiMaterial.groupEnd === -1 ) {

							lastMultiMaterial.groupEnd = this.geometry.vertices.length / 3;
							lastMultiMaterial.groupCount = lastMultiMaterial.groupEnd - lastMultiMaterial.groupStart;
							lastMultiMaterial.inherited = false;

						}

						// Ignore objects tail materials if no face declarations followed them before a new o/g started.
						if ( end && this.materials.length > 1 ) {

							for ( var mi = this.materials.length - 1; mi >= 0; mi-- ) {
								if ( this.materials[ mi ].groupCount <= 0 ) {
									this.materials.splice( mi, 1 );
								}
							}

						}

						// Guarantee at least one empty material, this makes the creation later more straight forward.
						if ( end && this.materials.length === 0 ) {

							this.materials.push({
								name   : '',
								smooth : this.smooth
							});

						}

						return lastMultiMaterial;

					}
				};

				// Inherit previous objects material.
				// Spec tells us that a declared material must be set to all objects until a new material is declared.
				// If a usemtl declaration is encountered while this new object is being parsed, it will
				// overwrite the inherited material. Exception being that there was already face declarations
				// to the inherited material, then it will be preserved for proper MultiMaterial continuation.

				if ( previousMaterial && previousMaterial.name && typeof previousMaterial.clone === 'function' ) {

					var declared = previousMaterial.clone( 0 );
					declared.inherited = true;
					this.object.materials.push( declared );

				}

				this.objects.push( this.object );

			},

			finalize: function () {

				if ( this.object && typeof this.object._finalize === 'function' ) {

					this.object._finalize( true );

				}

			},

			parseVertexIndex: function ( value, len ) {

				var index = parseInt( value, 10 );
				return ( index >= 0 ? index - 1 : index + len / 3 ) * 3;

			},

			parseNormalIndex: function ( value, len ) {

				var index = parseInt( value, 10 );
				return ( index >= 0 ? index - 1 : index + len / 3 ) * 3;

			},

			parseUVIndex: function ( value, len ) {

				var index = parseInt( value, 10 );
				return ( index >= 0 ? index - 1 : index + len / 2 ) * 2;

			},

			addVertex: function ( a, b, c ) {

				var src = this.vertices;
				var dst = this.object.geometry.vertices;

				dst.push( src[ a + 0 ], src[ a + 1 ], src[ a + 2 ] );
				dst.push( src[ b + 0 ], src[ b + 1 ], src[ b + 2 ] );
				dst.push( src[ c + 0 ], src[ c + 1 ], src[ c + 2 ] );

			},

			addVertexLine: function ( a ) {

				var src = this.vertices;
				var dst = this.object.geometry.vertices;

				dst.push( src[ a + 0 ], src[ a + 1 ], src[ a + 2 ] );

			},

			addNormal: function ( a, b, c ) {

				var src = this.normals;
				var dst = this.object.geometry.normals;

				dst.push( src[ a + 0 ], src[ a + 1 ], src[ a + 2 ] );
				dst.push( src[ b + 0 ], src[ b + 1 ], src[ b + 2 ] );
				dst.push( src[ c + 0 ], src[ c + 1 ], src[ c + 2 ] );

			},

			addUV: function ( a, b, c ) {

				var src = this.uvs;
				var dst = this.object.geometry.uvs;

				dst.push( src[ a + 0 ], src[ a + 1 ] );
				dst.push( src[ b + 0 ], src[ b + 1 ] );
				dst.push( src[ c + 0 ], src[ c + 1 ] );

			},

			addUVLine: function ( a ) {

				var src = this.uvs;
				var dst = this.object.geometry.uvs;

				dst.push( src[ a + 0 ], src[ a + 1 ] );

			},

			addFace: function ( a, b, c, ua, ub, uc, na, nb, nc ) {

				var vLen = this.vertices.length;

				var ia = this.parseVertexIndex( a, vLen );
				var ib = this.parseVertexIndex( b, vLen );
				var ic = this.parseVertexIndex( c, vLen );

				this.addVertex( ia, ib, ic );

				if ( ua !== undefined ) {

					var uvLen = this.uvs.length;

					ia = this.parseUVIndex( ua, uvLen );
					ib = this.parseUVIndex( ub, uvLen );
					ic = this.parseUVIndex( uc, uvLen );

					this.addUV( ia, ib, ic );

				}

				if ( na !== undefined ) {

					// Normals are many times the same. If so, skip function call and parseInt.
					var nLen = this.normals.length;
					ia = this.parseNormalIndex( na, nLen );

					ib = na === nb ? ia : this.parseNormalIndex( nb, nLen );
					ic = na === nc ? ia : this.parseNormalIndex( nc, nLen );

					this.addNormal( ia, ib, ic );

				}

			},

			addLineGeometry: function ( vertices, uvs ) {

				this.object.geometry.type = 'Line';

				var vLen = this.vertices.length;
				var uvLen = this.uvs.length;

				for ( var vi = 0, l = vertices.length; vi < l; vi ++ ) {

					this.addVertexLine( this.parseVertexIndex( vertices[ vi ], vLen ) );

				}

				for ( var uvi = 0, l = uvs.length; uvi < l; uvi ++ ) {

					this.addUVLine( this.parseUVIndex( uvs[ uvi ], uvLen ) );

				}

			}

		};

		state.startObject( '', false );

		return state;

	}

	//

	function OBJLoader( manager ) {

		this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

		this.materials = null;

	};

	OBJLoader.prototype = {

		constructor: OBJLoader,

		load: function ( url, onLoad, onProgress, onError ) {

			var scope = this;

			var loader = new THREE.FileLoader( scope.manager );
			loader.setPath( this.path );
			loader.load( url, function ( text ) {

				onLoad( scope.parse( text ) );

			}, onProgress, onError );

		},

		setPath: function ( value ) {

			this.path = value;

		},

		setMaterials: function ( materials ) {

			this.materials = materials;

			return this;

		},

		parse: function ( text ) {

			console.time( 'OBJLoader' );

			var state = new ParserState();

			if ( text.indexOf( '\r\n' ) !== - 1 ) {

				// This is faster than String.split with regex that splits on both
				text = text.replace( /\r\n/g, '\n' );

			}

			if ( text.indexOf( '\\\n' ) !== - 1) {

				// join lines separated by a line continuation character (\)
				text = text.replace( /\\\n/g, '' );

			}

			var lines = text.split( '\n' );
			var line = '', lineFirstChar = '';
			var lineLength = 0;
			var result = [];

			// Faster to just trim left side of the line. Use if available.
			var trimLeft = ( typeof ''.trimLeft === 'function' );

			for ( var i = 0, l = lines.length; i < l; i ++ ) {

				line = lines[ i ];

				line = trimLeft ? line.trimLeft() : line.trim();

				lineLength = line.length;

				if ( lineLength === 0 ) continue;

				lineFirstChar = line.charAt( 0 );

				// @todo invoke passed in handler if any
				if ( lineFirstChar === '#' ) continue;

				if ( lineFirstChar === 'v' ) {

					var data = line.split( /\s+/ );

					switch ( data[ 0 ] ) {

						case 'v':
							state.vertices.push(
								parseFloat( data[ 1 ] ),
								parseFloat( data[ 2 ] ),
								parseFloat( data[ 3 ] )
							);
							break;
						case 'vn':
							state.normals.push(
								parseFloat( data[ 1 ] ),
								parseFloat( data[ 2 ] ),
								parseFloat( data[ 3 ] )
							);
							break;
						case 'vt':
							state.uvs.push(
								parseFloat( data[ 1 ] ),
								parseFloat( data[ 2 ] )
							);
							break;
					}

				} else if ( lineFirstChar === 'f' ) {

					var lineData = line.substr( 1 ).trim();
					var vertexData = lineData.split( /\s+/ );
					var faceVertices = [];

					// Parse the face vertex data into an easy to work with format

					for ( var j = 0, jl = vertexData.length; j < jl; j ++ ) {

						var vertex = vertexData[ j ];

						if ( vertex.length > 0 ) {

							var vertexParts = vertex.split( '/' );
							faceVertices.push( vertexParts );

						}

					}

					// Draw an edge between the first vertex and all subsequent vertices to form an n-gon

					var v1 = faceVertices[ 0 ];

					for ( var j = 1, jl = faceVertices.length - 1; j < jl; j ++ ) {

						var v2 = faceVertices[ j ];
						var v3 = faceVertices[ j + 1 ];

						state.addFace(
							v1[ 0 ], v2[ 0 ], v3[ 0 ],
							v1[ 1 ], v2[ 1 ], v3[ 1 ],
							v1[ 2 ], v2[ 2 ], v3[ 2 ]
						);

					}

				} else if ( lineFirstChar === 'l' ) {

					var lineParts = line.substring( 1 ).trim().split( " " );
					var lineVertices = [], lineUVs = [];

					if ( line.indexOf( "/" ) === - 1 ) {

						lineVertices = lineParts;

					} else {

						for ( var li = 0, llen = lineParts.length; li < llen; li ++ ) {

							var parts = lineParts[ li ].split( "/" );

							if ( parts[ 0 ] !== "" ) lineVertices.push( parts[ 0 ] );
							if ( parts[ 1 ] !== "" ) lineUVs.push( parts[ 1 ] );

						}

					}
					state.addLineGeometry( lineVertices, lineUVs );

				} else if ( ( result = object_pattern.exec( line ) ) !== null ) {

					// o object_name
					// or
					// g group_name

					// WORKAROUND: https://bugs.chromium.org/p/v8/issues/detail?id=2869
					// var name = result[ 0 ].substr( 1 ).trim();
					var name = ( " " + result[ 0 ].substr( 1 ).trim() ).substr( 1 );

					state.startObject( name );

				} else if ( material_use_pattern.test( line ) ) {

					// material

					state.object.startMaterial( line.substring( 7 ).trim(), state.materialLibraries );

				} else if ( material_library_pattern.test( line ) ) {

					// mtl file

					state.materialLibraries.push( line.substring( 7 ).trim() );

				} else if ( lineFirstChar === 's' ) {

					result = line.split( ' ' );

					// smooth shading

					// @todo Handle files that have varying smooth values for a set of faces inside one geometry,
					// but does not define a usemtl for each face set.
					// This should be detected and a dummy material created (later MultiMaterial and geometry groups).
					// This requires some care to not create extra material on each smooth value for "normal" obj files.
					// where explicit usemtl defines geometry groups.
					// Example asset: examples/models/obj/cerberus/Cerberus.obj

					/*
					 * http://paulbourke.net/dataformats/obj/
					 * or
					 * http://www.cs.utah.edu/~boulos/cs3505/obj_spec.pdf
					 *
					 * From chapter "Grouping" Syntax explanation "s group_number":
					 * "group_number is the smoothing group number. To turn off smoothing groups, use a value of 0 or off.
					 * Polygonal elements use group numbers to put elements in different smoothing groups. For free-form
					 * surfaces, smoothing groups are either turned on or off; there is no difference between values greater
					 * than 0."
					 */
					if ( result.length > 1 ) {

						var value = result[ 1 ].trim().toLowerCase();
						state.object.smooth = ( value !== '0' && value !== 'off' );

					} else {

						// ZBrush can produce "s" lines #11707
						state.object.smooth = true;

					}
					var material = state.object.currentMaterial();
					if ( material ) material.smooth = state.object.smooth;

				} else {

					// Handle null terminated files without exception
					if ( line === '\0' ) continue;

					throw new Error( "Unexpected line: '" + line  + "'" );

				}

			}

			state.finalize();

			var container = new THREE.Group();
			container.materialLibraries = [].concat( state.materialLibraries );

			for ( var i = 0, l = state.objects.length; i < l; i ++ ) {

				var object = state.objects[ i ];
				var geometry = object.geometry;
				var materials = object.materials;
				var isLine = ( geometry.type === 'Line' );

				// Skip o/g line declarations that did not follow with any faces
				if ( geometry.vertices.length === 0 ) continue;

				var buffergeometry = new THREE.BufferGeometry();

				buffergeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( geometry.vertices ), 3 ) );

				if ( geometry.normals.length > 0 ) {

					buffergeometry.addAttribute( 'normal', new THREE.BufferAttribute( new Float32Array( geometry.normals ), 3 ) );

				} else {

					buffergeometry.computeVertexNormals();

				}

				if ( geometry.uvs.length > 0 ) {

					buffergeometry.addAttribute( 'uv', new THREE.BufferAttribute( new Float32Array( geometry.uvs ), 2 ) );

				}

				// Create materials

				var createdMaterials = [];

				for ( var mi = 0, miLen = materials.length; mi < miLen ; mi++ ) {

					var sourceMaterial = materials[ mi ];
					var material = undefined;

					if ( this.materials !== null ) {

						material = this.materials.create( sourceMaterial.name );

						// mtl etc. loaders probably can't create line materials correctly, copy properties to a line material.
						if ( isLine && material && ! ( material instanceof THREE.LineBasicMaterial ) ) {

							var materialLine = new THREE.LineBasicMaterial();
							materialLine.copy( material );
							material = materialLine;

						}

					}

					if ( ! material ) {

						material = ( ! isLine ? new THREE.MeshPhongMaterial() : new THREE.LineBasicMaterial() );
						material.name = sourceMaterial.name;

					}

					material.flatShading = sourceMaterial.smooth ? false : true;

					createdMaterials.push(material);

				}

				// Create mesh

				var mesh;

				if ( createdMaterials.length > 1 ) {

					for ( var mi = 0, miLen = materials.length; mi < miLen ; mi++ ) {

						var sourceMaterial = materials[ mi ];
						buffergeometry.addGroup( sourceMaterial.groupStart, sourceMaterial.groupCount, mi );

					}

					mesh = ( ! isLine ? new THREE.Mesh( buffergeometry, createdMaterials ) : new THREE.LineSegments( buffergeometry, createdMaterials ) );

				} else {

					mesh = ( ! isLine ? new THREE.Mesh( buffergeometry, createdMaterials[ 0 ] ) : new THREE.LineSegments( buffergeometry, createdMaterials[ 0 ] ) );
				}

				mesh.name = object.name;

				container.add( mesh );

			}

			console.timeEnd( 'OBJLoader' );

			return container;

		}

	};

	return OBJLoader;

} )();

/*
 * @author Daosheng Mu / https://github.com/DaoshengMu/
 * @author mrdoob / http://mrdoob.com/
 * @author takahirox / https://github.com/takahirox/
 */

THREE.TGALoader = function ( manager ) {

	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

};

THREE.TGALoader.prototype = {

	constructor: THREE.TGALoader,

	load: function ( url, onLoad, onProgress, onError ) {

		var scope = this;

		var texture = new THREE.Texture();

		var loader = new THREE.FileLoader( this.manager );
		loader.setResponseType( 'arraybuffer' );

		loader.load( url, function ( buffer ) {

			texture.image = scope.parse( buffer );
			texture.needsUpdate = true;

			if ( onLoad !== undefined ) {

				onLoad( texture );

			}

		}, onProgress, onError );

		return texture;

	},

	parse: function ( buffer ) {

		// reference from vthibault, https://github.com/vthibault/roBrowser/blob/master/src/Loaders/Targa.js

		function tgaCheckHeader( header ) {

			switch ( header.image_type ) {

				// check indexed type

				case TGA_TYPE_INDEXED:
				case TGA_TYPE_RLE_INDEXED:
					if ( header.colormap_length > 256 || header.colormap_size !== 24 || header.colormap_type !== 1 ) {

						console.error( 'THREE.TGALoader: Invalid type colormap data for indexed type.' );

					}
					break;

				// check colormap type

				case TGA_TYPE_RGB:
				case TGA_TYPE_GREY:
				case TGA_TYPE_RLE_RGB:
				case TGA_TYPE_RLE_GREY:
					if ( header.colormap_type ) {

						console.error( 'THREE.TGALoader: Invalid type colormap data for colormap type.' );

					}
					break;

				// What the need of a file without data ?

				case TGA_TYPE_NO_DATA:
					console.error( 'THREE.TGALoader: No data.' );

				// Invalid type ?

				default:
					console.error( 'THREE.TGALoader: Invalid type "%s".', header.image_type );

			}

			// check image width and height

			if ( header.width <= 0 || header.height <= 0 ) {

				console.error( 'THREE.TGALoader: Invalid image size.' );

			}

			// check image pixel size

			if ( header.pixel_size !== 8 && header.pixel_size !== 16 &&
				header.pixel_size !== 24 && header.pixel_size !== 32 ) {

				console.error( 'THREE.TGALoader: Invalid pixel size "%s".', header.pixel_size );

			}

		}

		// parse tga image buffer

		function tgaParse( use_rle, use_pal, header, offset, data ) {

			var pixel_data,
				pixel_size,
				pixel_total,
				palettes;

			pixel_size = header.pixel_size >> 3;
			pixel_total = header.width * header.height * pixel_size;

			 // read palettes

			 if ( use_pal ) {

				 palettes = data.subarray( offset, offset += header.colormap_length * ( header.colormap_size >> 3 ) );

			 }

			 // read RLE

			 if ( use_rle ) {

				 pixel_data = new Uint8Array( pixel_total );

				var c, count, i;
				var shift = 0;
				var pixels = new Uint8Array( pixel_size );

				while ( shift < pixel_total ) {

					c = data[ offset ++ ];
					count = ( c & 0x7f ) + 1;

					// RLE pixels

					if ( c & 0x80 ) {

						// bind pixel tmp array

						for ( i = 0; i < pixel_size; ++ i ) {

							pixels[ i ] = data[ offset ++ ];

						}

						// copy pixel array

						for ( i = 0; i < count; ++ i ) {

							pixel_data.set( pixels, shift + i * pixel_size );

						}

						shift += pixel_size * count;

					} else {

						// raw pixels

						count *= pixel_size;
						for ( i = 0; i < count; ++ i ) {

							pixel_data[ shift + i ] = data[ offset ++ ];

						}
						shift += count;

					}

				}

			 } else {

				// raw pixels

				pixel_data = data.subarray(
					 offset, offset += ( use_pal ? header.width * header.height : pixel_total )
				);

			 }

			 return {
				pixel_data: pixel_data,
				palettes: palettes
			 };

		}

		function tgaGetImageData8bits( imageData, y_start, y_step, y_end, x_start, x_step, x_end, image, palettes ) {

			var colormap = palettes;
			var color, i = 0, x, y;
			var width = header.width;

			for ( y = y_start; y !== y_end; y += y_step ) {

				for ( x = x_start; x !== x_end; x += x_step, i ++ ) {

					color = image[ i ];
					imageData[ ( x + width * y ) * 4 + 3 ] = 255;
					imageData[ ( x + width * y ) * 4 + 2 ] = colormap[ ( color * 3 ) + 0 ];
					imageData[ ( x + width * y ) * 4 + 1 ] = colormap[ ( color * 3 ) + 1 ];
					imageData[ ( x + width * y ) * 4 + 0 ] = colormap[ ( color * 3 ) + 2 ];

				}

			}

			return imageData;

		}

		function tgaGetImageData16bits( imageData, y_start, y_step, y_end, x_start, x_step, x_end, image ) {

			var color, i = 0, x, y;
			var width = header.width;

			for ( y = y_start; y !== y_end; y += y_step ) {

				for ( x = x_start; x !== x_end; x += x_step, i += 2 ) {

					color = image[ i + 0 ] + ( image[ i + 1 ] << 8 ); // Inversed ?
					imageData[ ( x + width * y ) * 4 + 0 ] = ( color & 0x7C00 ) >> 7;
					imageData[ ( x + width * y ) * 4 + 1 ] = ( color & 0x03E0 ) >> 2;
					imageData[ ( x + width * y ) * 4 + 2 ] = ( color & 0x001F ) >> 3;
					imageData[ ( x + width * y ) * 4 + 3 ] = ( color & 0x8000 ) ? 0 : 255;

				}

			}

			return imageData;

		}

		function tgaGetImageData24bits( imageData, y_start, y_step, y_end, x_start, x_step, x_end, image ) {

			var i = 0, x, y;
			var width = header.width;

			for ( y = y_start; y !== y_end; y += y_step ) {

				for ( x = x_start; x !== x_end; x += x_step, i += 3 ) {

					imageData[ ( x + width * y ) * 4 + 3 ] = 255;
					imageData[ ( x + width * y ) * 4 + 2 ] = image[ i + 0 ];
					imageData[ ( x + width * y ) * 4 + 1 ] = image[ i + 1 ];
					imageData[ ( x + width * y ) * 4 + 0 ] = image[ i + 2 ];

				}

			}

			return imageData;

		}

		function tgaGetImageData32bits( imageData, y_start, y_step, y_end, x_start, x_step, x_end, image ) {

			var i = 0, x, y;
			var width = header.width;

			for ( y = y_start; y !== y_end; y += y_step ) {

				for ( x = x_start; x !== x_end; x += x_step, i += 4 ) {

					imageData[ ( x + width * y ) * 4 + 2 ] = image[ i + 0 ];
					imageData[ ( x + width * y ) * 4 + 1 ] = image[ i + 1 ];
					imageData[ ( x + width * y ) * 4 + 0 ] = image[ i + 2 ];
					imageData[ ( x + width * y ) * 4 + 3 ] = image[ i + 3 ];

				}

			}

			return imageData;

		}

		function tgaGetImageDataGrey8bits( imageData, y_start, y_step, y_end, x_start, x_step, x_end, image ) {

			var color, i = 0, x, y;
			var width = header.width;

			for ( y = y_start; y !== y_end; y += y_step ) {

				for ( x = x_start; x !== x_end; x += x_step, i ++ ) {

					color = image[ i ];
					imageData[ ( x + width * y ) * 4 + 0 ] = color;
					imageData[ ( x + width * y ) * 4 + 1 ] = color;
					imageData[ ( x + width * y ) * 4 + 2 ] = color;
					imageData[ ( x + width * y ) * 4 + 3 ] = 255;

				}

			}

			return imageData;

		}

		function tgaGetImageDataGrey16bits( imageData, y_start, y_step, y_end, x_start, x_step, x_end, image ) {

			var i = 0, x, y;
			var width = header.width;

			for ( y = y_start; y !== y_end; y += y_step ) {

				for ( x = x_start; x !== x_end; x += x_step, i += 2 ) {

					imageData[ ( x + width * y ) * 4 + 0 ] = image[ i + 0 ];
					imageData[ ( x + width * y ) * 4 + 1 ] = image[ i + 0 ];
					imageData[ ( x + width * y ) * 4 + 2 ] = image[ i + 0 ];
					imageData[ ( x + width * y ) * 4 + 3 ] = image[ i + 1 ];

				}

			}

			return imageData;

		}

		function getTgaRGBA( data, width, height, image, palette ) {

			var x_start,
				y_start,
				x_step,
				y_step,
				x_end,
				y_end;

			switch ( ( header.flags & TGA_ORIGIN_MASK ) >> TGA_ORIGIN_SHIFT ) {

				default:
				case TGA_ORIGIN_UL:
					x_start = 0;
					x_step = 1;
					x_end = width;
					y_start = 0;
					y_step = 1;
					y_end = height;
					break;

				case TGA_ORIGIN_BL:
					x_start = 0;
					x_step = 1;
					x_end = width;
					y_start = height - 1;
					y_step = - 1;
					y_end = - 1;
					break;

				case TGA_ORIGIN_UR:
					x_start = width - 1;
					x_step = - 1;
					x_end = - 1;
					y_start = 0;
					y_step = 1;
					y_end = height;
					break;

				case TGA_ORIGIN_BR:
					x_start = width - 1;
					x_step = - 1;
					x_end = - 1;
					y_start = height - 1;
					y_step = - 1;
					y_end = - 1;
					break;

			}

			if ( use_grey ) {

				switch ( header.pixel_size ) {

					case 8:
						tgaGetImageDataGrey8bits( data, y_start, y_step, y_end, x_start, x_step, x_end, image );
						break;

					case 16:
						tgaGetImageDataGrey16bits( data, y_start, y_step, y_end, x_start, x_step, x_end, image );
						break;

					default:
						console.error( 'THREE.TGALoader: Format not supported.' );
						break;

				}

			} else {

				switch ( header.pixel_size ) {

					case 8:
						tgaGetImageData8bits( data, y_start, y_step, y_end, x_start, x_step, x_end, image, palette );
						break;

					case 16:
						tgaGetImageData16bits( data, y_start, y_step, y_end, x_start, x_step, x_end, image );
						break;

					case 24:
						tgaGetImageData24bits( data, y_start, y_step, y_end, x_start, x_step, x_end, image );
						break;

					case 32:
						tgaGetImageData32bits( data, y_start, y_step, y_end, x_start, x_step, x_end, image );
						break;

					default:
						console.error( 'THREE.TGALoader: Format not supported.' );
						break;

				}

			}

			// Load image data according to specific method
			// var func = 'tgaGetImageData' + (use_grey ? 'Grey' : '') + (header.pixel_size) + 'bits';
			// func(data, y_start, y_step, y_end, x_start, x_step, x_end, width, image, palette );
			return data;

		}

		// TGA constants

		var TGA_TYPE_NO_DATA = 0,
			TGA_TYPE_INDEXED = 1,
			TGA_TYPE_RGB = 2,
			TGA_TYPE_GREY = 3,
			TGA_TYPE_RLE_INDEXED = 9,
			TGA_TYPE_RLE_RGB = 10,
			TGA_TYPE_RLE_GREY = 11,

			TGA_ORIGIN_MASK = 0x30,
			TGA_ORIGIN_SHIFT = 0x04,
			TGA_ORIGIN_BL = 0x00,
			TGA_ORIGIN_BR = 0x01,
			TGA_ORIGIN_UL = 0x02,
			TGA_ORIGIN_UR = 0x03;

		if ( buffer.length < 19 ) console.error( 'THREE.TGALoader: Not enough data to contain header.' );

		var content = new Uint8Array( buffer ),
			offset = 0,
			header = {
				id_length: content[ offset ++ ],
				colormap_type: content[ offset ++ ],
				image_type: content[ offset ++ ],
				colormap_index: content[ offset ++ ] | content[ offset ++ ] << 8,
				colormap_length: content[ offset ++ ] | content[ offset ++ ] << 8,
				colormap_size: content[ offset ++ ],
				origin: [
					content[ offset ++ ] | content[ offset ++ ] << 8,
					content[ offset ++ ] | content[ offset ++ ] << 8
				],
				width: content[ offset ++ ] | content[ offset ++ ] << 8,
				height: content[ offset ++ ] | content[ offset ++ ] << 8,
				pixel_size: content[ offset ++ ],
				flags: content[ offset ++ ]
			};

			// check tga if it is valid format

		tgaCheckHeader( header );

		if ( header.id_length + offset > buffer.length ) {

			console.error( 'THREE.TGALoader: No data.' );

		}

		// skip the needn't data

		offset += header.id_length;

		// get targa information about RLE compression and palette

		var use_rle = false,
			use_pal = false,
			use_grey = false;

		switch ( header.image_type ) {

			case TGA_TYPE_RLE_INDEXED:
				use_rle = true;
				use_pal = true;
				break;

			case TGA_TYPE_INDEXED:
				use_pal = true;
				break;

			case TGA_TYPE_RLE_RGB:
				use_rle = true;
				break;

			case TGA_TYPE_RGB:
				break;

			case TGA_TYPE_RLE_GREY:
				use_rle = true;
				use_grey = true;
				break;

			case TGA_TYPE_GREY:
				use_grey = true;
				break;

		}

		//

		var canvas = document.createElement( 'canvas' );
		canvas.width = header.width;
		canvas.height = header.height;

		var context = canvas.getContext( '2d' );
		var imageData = context.createImageData( header.width, header.height );

		var result = tgaParse( use_rle, use_pal, header, offset, content );
		var rgbaData = getTgaRGBA( imageData.data, header.width, header.height, result.pixel_data, result.palettes );

		context.putImageData( imageData, 0, 0 );

		return canvas;

	}

};

/**
 * Loads a Wavefront .mtl file specifying materials
 *
 * @author angelxuanchang
 */

THREE.MTLLoader = function ( manager ) {

	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

};

THREE.MTLLoader.prototype = {

	constructor: THREE.MTLLoader,

	/**
	 * Loads and parses a MTL asset from a URL.
	 *
	 * @param {String} url - URL to the MTL file.
	 * @param {Function} [onLoad] - Callback invoked with the loaded object.
	 * @param {Function} [onProgress] - Callback for download progress.
	 * @param {Function} [onError] - Callback for download errors.
	 *
	 * @see setPath setTexturePath
	 *
	 * @note In order for relative texture references to resolve correctly
	 * you must call setPath and/or setTexturePath explicitly prior to load.
	 */
	load: function ( url, onLoad, onProgress, onError ) {

		var scope = this;

		var loader = new THREE.FileLoader( this.manager );
		loader.setPath( this.path );
		loader.load( url, function ( text ) {

			onLoad( scope.parse( text ) );

		}, onProgress, onError );

	},

	/**
	 * Set base path for resolving references.
	 * If set this path will be prepended to each loaded and found reference.
	 *
	 * @see setTexturePath
	 * @param {String} path
	 *
	 * @example
	 *     mtlLoader.setPath( 'assets/obj/' );
	 *     mtlLoader.load( 'my.mtl', ... );
	 */
	setPath: function ( path ) {

		this.path = path;

	},

	/**
	 * Set base path for resolving texture references.
	 * If set this path will be prepended found texture reference.
	 * If not set and setPath is, it will be used as texture base path.
	 *
	 * @see setPath
	 * @param {String} path
	 *
	 * @example
	 *     mtlLoader.setPath( 'assets/obj/' );
	 *     mtlLoader.setTexturePath( 'assets/textures/' );
	 *     mtlLoader.load( 'my.mtl', ... );
	 */
	setTexturePath: function ( path ) {

		this.texturePath = path;

	},

	setBaseUrl: function ( path ) {

		console.warn( 'THREE.MTLLoader: .setBaseUrl() is deprecated. Use .setTexturePath( path ) for texture path or .setPath( path ) for general base path instead.' );

		this.setTexturePath( path );

	},

	setCrossOrigin: function ( value ) {

		this.crossOrigin = value;

	},

	setMaterialOptions: function ( value ) {

		this.materialOptions = value;

	},

	/**
	 * Parses a MTL file.
	 *
	 * @param {String} text - Content of MTL file
	 * @return {THREE.MTLLoader.MaterialCreator}
	 *
	 * @see setPath setTexturePath
	 *
	 * @note In order for relative texture references to resolve correctly
	 * you must call setPath and/or setTexturePath explicitly prior to parse.
	 */
	parse: function ( text ) {

		var lines = text.split( '\n' );
		var info = {};
		var delimiter_pattern = /\s+/;
		var materialsInfo = {};

		for ( var i = 0; i < lines.length; i ++ ) {

			var line = lines[ i ];
			line = line.trim();

			if ( line.length === 0 || line.charAt( 0 ) === '#' ) {

				// Blank line or comment ignore
				continue;

			}

			var pos = line.indexOf( ' ' );

			var key = ( pos >= 0 ) ? line.substring( 0, pos ) : line;
			key = key.toLowerCase();

			var value = ( pos >= 0 ) ? line.substring( pos + 1 ) : '';
			value = value.trim();

			if ( key === 'newmtl' ) {

				// New material

				info = { name: value };
				materialsInfo[ value ] = info;

			} else if ( info ) {

				if ( key === 'ka' || key === 'kd' || key === 'ks' ) {

					var ss = value.split( delimiter_pattern, 3 );
					info[ key ] = [ parseFloat( ss[ 0 ] ), parseFloat( ss[ 1 ] ), parseFloat( ss[ 2 ] ) ];

				} else {

					info[ key ] = value;

				}

			}

		}

		var materialCreator = new THREE.MTLLoader.MaterialCreator( this.texturePath || this.path, this.materialOptions );
		materialCreator.setCrossOrigin( this.crossOrigin );
		materialCreator.setManager( this.manager );
		materialCreator.setMaterials( materialsInfo );
		return materialCreator;

	}

};

/**
 * Create a new THREE-MTLLoader.MaterialCreator
 * @param baseUrl - Url relative to which textures are loaded
 * @param options - Set of options on how to construct the materials
 *                  side: Which side to apply the material
 *                        THREE.FrontSide (default), THREE.BackSide, THREE.DoubleSide
 *                  wrap: What type of wrapping to apply for textures
 *                        THREE.RepeatWrapping (default), THREE.ClampToEdgeWrapping, THREE.MirroredRepeatWrapping
 *                  normalizeRGB: RGBs need to be normalized to 0-1 from 0-255
 *                                Default: false, assumed to be already normalized
 *                  ignoreZeroRGBs: Ignore values of RGBs (Ka,Kd,Ks) that are all 0's
 *                                  Default: false
 * @constructor
 */

THREE.MTLLoader.MaterialCreator = function ( baseUrl, options ) {

	this.baseUrl = baseUrl || '';
	this.options = options;
	this.materialsInfo = {};
	this.materials = {};
	this.materialsArray = [];
	this.nameLookup = {};

	this.side = ( this.options && this.options.side ) ? this.options.side : THREE.FrontSide;
	this.wrap = ( this.options && this.options.wrap ) ? this.options.wrap : THREE.RepeatWrapping;

};

THREE.MTLLoader.MaterialCreator.prototype = {

	constructor: THREE.MTLLoader.MaterialCreator,

	crossOrigin: 'Anonymous',

	setCrossOrigin: function ( value ) {

		this.crossOrigin = value;

	},

	setManager: function ( value ) {

		this.manager = value;

	},

	setMaterials: function ( materialsInfo ) {

		this.materialsInfo = this.convert( materialsInfo );
		this.materials = {};
		this.materialsArray = [];
		this.nameLookup = {};

	},

	convert: function ( materialsInfo ) {

		if ( ! this.options ) return materialsInfo;

		var converted = {};

		for ( var mn in materialsInfo ) {

			// Convert materials info into normalized form based on options

			var mat = materialsInfo[ mn ];

			var covmat = {};

			converted[ mn ] = covmat;

			for ( var prop in mat ) {

				var save = true;
				var value = mat[ prop ];
				var lprop = prop.toLowerCase();

				switch ( lprop ) {

					case 'kd':
					case 'ka':
					case 'ks':

						// Diffuse color (color under white light) using RGB values

						if ( this.options && this.options.normalizeRGB ) {

							value = [ value[ 0 ] / 255, value[ 1 ] / 255, value[ 2 ] / 255 ];

						}

						if ( this.options && this.options.ignoreZeroRGBs ) {

							if ( value[ 0 ] === 0 && value[ 1 ] === 0 && value[ 2 ] === 0 ) {

								// ignore

								save = false;

							}

						}

						break;

					default:

						break;

				}

				if ( save ) {

					covmat[ lprop ] = value;

				}

			}

		}

		return converted;

	},

	preload: function () {

		for ( var mn in this.materialsInfo ) {

			this.create( mn );

		}

	},

	getIndex: function ( materialName ) {

		return this.nameLookup[ materialName ];

	},

	getAsArray: function () {

		var index = 0;

		for ( var mn in this.materialsInfo ) {

			this.materialsArray[ index ] = this.create( mn );
			this.nameLookup[ mn ] = index;
			index ++;

		}

		return this.materialsArray;

	},

	create: function ( materialName ) {

		if ( this.materials[ materialName ] === undefined ) {

			this.createMaterial_( materialName );

		}

		return this.materials[ materialName ];

	},

	createMaterial_: function ( materialName ) {

		// Create material

		var scope = this;
		var mat = this.materialsInfo[ materialName ];
		var params = {

			name: materialName,
			side: this.side

		};

		function resolveURL( baseUrl, url ) {

			if ( typeof url !== 'string' || url === '' )
				return '';

			// Absolute URL
			if ( /^https?:\/\//i.test( url ) ) return url;

			return baseUrl + url;

		}

		function setMapForType( mapType, value ) {

			if ( params[ mapType ] ) return; // Keep the first encountered texture

			var texParams = scope.getTextureParams( value, params );
			var map = scope.loadTexture( resolveURL( scope.baseUrl, texParams.url ) );

			map.repeat.copy( texParams.scale );
			map.offset.copy( texParams.offset );

			map.wrapS = scope.wrap;
			map.wrapT = scope.wrap;

			params[ mapType ] = map;

		}

		for ( var prop in mat ) {

			var value = mat[ prop ];
			var n;

			if ( value === '' ) continue;

			switch ( prop.toLowerCase() ) {

				// Ns is material specular exponent

				case 'kd':

					// Diffuse color (color under white light) using RGB values

					params.color = new THREE.Color().fromArray( value );

					break;

				case 'ks':

					// Specular color (color when light is reflected from shiny surface) using RGB values
					params.specular = new THREE.Color().fromArray( value );

					break;

				case 'map_kd':

					// Diffuse texture map

					setMapForType( "map", value );

					break;

				case 'map_ks':

					// Specular map

					setMapForType( "specularMap", value );

					break;

				case 'norm':

					setMapForType( "normalMap", value );

					break;

				case 'map_bump':
				case 'bump':

					// Bump texture map

					setMapForType( "bumpMap", value );

					break;

				case 'ns':

					// The specular exponent (defines the focus of the specular highlight)
					// A high exponent results in a tight, concentrated highlight. Ns values normally range from 0 to 1000.

					params.shininess = parseFloat( value );

					break;

				case 'd':
					n = parseFloat( value );

					if ( n < 1 ) {

						params.opacity = n;
						params.transparent = true;

					}

					break;

				case 'tr':
					n = parseFloat( value );

					if ( n > 0 ) {

						params.opacity = 1 - n;
						params.transparent = true;

					}

					break;

				default:
					break;

			}

		}

		this.materials[ materialName ] = new THREE.MeshPhongMaterial( params );
		return this.materials[ materialName ];

	},

	getTextureParams: function ( value, matParams ) {

		var texParams = {

			scale: new THREE.Vector2( 1, 1 ),
			offset: new THREE.Vector2( 0, 0 )

		 };

		var items = value.split( /\s+/ );
		var pos;

		pos = items.indexOf( '-bm' );

		if ( pos >= 0 ) {

			matParams.bumpScale = parseFloat( items[ pos + 1 ] );
			items.splice( pos, 2 );

		}

		pos = items.indexOf( '-s' );

		if ( pos >= 0 ) {

			texParams.scale.set( parseFloat( items[ pos + 1 ] ), parseFloat( items[ pos + 2 ] ) );
			items.splice( pos, 4 ); // we expect 3 parameters here!

		}

		pos = items.indexOf( '-o' );

		if ( pos >= 0 ) {

			texParams.offset.set( parseFloat( items[ pos + 1 ] ), parseFloat( items[ pos + 2 ] ) );
			items.splice( pos, 4 ); // we expect 3 parameters here!

		}

		texParams.url = items.join( ' ' ).trim();
		return texParams;

	},

	loadTexture: function ( url, mapping, onLoad, onProgress, onError ) {

		var texture;
		var loader = THREE.Loader.Handlers.get( url );
		var manager = ( this.manager !== undefined ) ? this.manager : THREE.DefaultLoadingManager;

		if ( loader === null ) {

			loader = new THREE.TextureLoader( manager );

		}

		if ( loader.setCrossOrigin ) loader.setCrossOrigin( this.crossOrigin );
		texture = loader.load( url, onLoad, onProgress, onError );

		if ( mapping !== undefined ) texture.mapping = mapping;

		return texture;

	}

};

let environment = {}

let setUpEnvironment = () => {
    // Add fog.
    scene.fog = new THREE.FogExp2(0xd5e1e3, 0.007);
    renderer.setClearColor(0x00c5ff);

    // Add light.
    ambientLight = new THREE.AmbientLight(0xC4CEE2);
    scene.add(ambientLight);

    // Environment cube.
    environment.sphere = new THREE.Mesh(new THREE.BufferGeometry().fromGeometry(new THREE.SphereGeometry(4e3)), materials.sky);
    scene.add(environment.sphere);
    environment.sphere.scale.y = 0.05;

    THREE.Water = (geometry, options) => {
        THREE.Mesh.call(this, geometry);

        let scope = this;
        options = options || {};

        let textureWidth = options.textureWidth != undefined ? options.textureWidth: 512;
        let textureHeight = options.textureHeight != undefined ? options.textureHeight: 512;

        let alpha = options.alpha != undefined ? options.alpha: 1.0;
        let time = options.time != undefined ? options.time: 0.0;

        let normalSampler = options.waterNormals != undefined ? options.waterNormals: null;
        let sunDirection = options.sunDirection != undefined ? options.sunDirection: new THREE.Vector3(0.70707, 0.70707, 0.0);

        let sunColor = new THREE.Color(options.sunColor != undefined ? options.sunColor: 0xffffff);
        let waterColor = new THREE.Color(options.waterColor != undefined ? options.waterColor: 0x7f7f7f);

        let distortionScale = options.distortionScale != undefined ? options.distortionScale: 20.0;

        let eye = options.eye != undefined ? options.eye: new THREE.Vector3(0, 0, 0);
        let side = options.side != undefined ? options.side: THREE.FrontSide;
        let fog = options.fog != undefined ? options.fog: false;

        let normal = new THREE.Vector3();
        let target = new THREE.Vector3();
        let textureMatrix = new THREE.Matrix4();

        let parameters = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBFormat,
            stencilBuffer: false
        }

        let renderTarget = new THREE.WebGLRenderTarget(textureWidth, textureHeight, parameters);
        if(!THREE.Math.isPowerOfTwo(textureWidth) || !THREE.Math.isPowerOfTwo(textureHeight)) renderTarget.texture.generatedMipmaps = false;

        let mirrorShader = {
            uniforms: THREE.UniformsUtils.merge([
                THREE.UniformsLib.fog,
                THREE.UniformsLib.lights,
                {
                    normalSampler: { value: null },
                    mirrorSampler: { value: null },
                    alpha: { value: 1.0 },
                    time: { value: 0.0 },
                    size: { value: 10.0 },
                    distortionScale: { value: 0.0 },
                    textureMatrix: { value: new THREE.Matrix4() },
                    sunColor: { value: new THREE.Color(0x7f7f7f) },
                    sunDirection: { value: new THREE.Vector3(0, 0.70707, 0) },
                    eye: { value: new THREE.Vector3() },
                    waterColor: { value: new THREE.Color(0x555555) }
                }
            ]),
            vertexShader: [
                `uniform mat4 textureMatrix;`,
                `uniform float time;`,
                
                `varying vec4 mirrorCoord;`,
                `varying vec4 worldPosition;`,

                THREE.ShaderChunk.fog_vertex,
                THREE.ShaderChunk.shadowmap_vertex,
                `}`
            ].join(`\n`),
            fragmentShader: [
                `uniform sampler2D mirrorSampler;`,
                `uniform float alpha;`,
                `uniform float time;`,
                `uniform float size;`,
                `uniform float distortionScale;`,
                `uniform sampler2D normalSampler;`,
                `uniform vec3 sunColor;`,
                `uniform vec3 sunDirection;`,
                `uniform vec3 eye;`,
                `uniform vec3 waterColor;`,
    
                `varying vec4 mirrorCoord;`,
                `varying vec4 worldPosition;`,
    
                `vec4 getNoise( vec2 uv ) {`,
                `	vec2 uv0 = ( uv / 103.0 ) + vec2(time / 17.0, time / 29.0);`,
                `	vec2 uv1 = uv / 107.0-vec2( time / -19.0, time / 31.0 );`,
                `	vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( time / 101.0, time / 97.0 );`,
                `	vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( time / 109.0, time / -113.0 );`,
                `	vec4 noise = texture2D( normalSampler, uv0 ) +`,
                `		texture2D( normalSampler, uv1 ) +`,
                `		texture2D( normalSampler, uv2 ) +`,
                `		texture2D( normalSampler, uv3 );`,
                `	return noise * 0.5 - 1.0;`,
                `}`,
    
                `void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor ) {`,
                `	vec3 reflection = normalize( reflect( sunDirection, surfaceNormal ) );`,
                `	float direction = max( 0.0, dot( eyeDirection, reflection ) );`,
                `	specularColor -= pow( direction, shiny ) * sunColor * spec;`,
                `	diffuseColor -= max( dot( sunDirection, surfaceNormal ), 0.0 ) * sunColor * diffuse;`,
                `}`,

                THREE.ShaderChunk.common,
                THREE.ShaderChunk.packing,
                THREE.ShaderChunk.bsdfs,
                THREE.ShaderChunk.fog_pars_fragment,
                THREE.ShaderChunk.lights_pars_begin,
                THREE.ShaderChunk.shadowmap_pars_fragment,
                THREE.ShaderChunk.shadowmask_pars_fragment,

                `void main() {`,
                `	vec4 noise = getNoise( worldPosition.xz * size );`,
                `	vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );`,
    
                `	vec3 diffuseLight = vec3(0.0);`,
                `	vec3 specularLight = vec3(0.0);`,
    
                `	vec3 worldToEye = eye-worldPosition.xyz;`,
                `	vec3 eyeDirection = vec3( 0.7, 0.5, 0.9 );`,
                `	sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );`,
    
                `	float distance = length(worldToEye);`,
    
                `	vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / distance ) * distortionScale;`,
                `	vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.w + distortion ) );`,
    
                `	float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );`,
                `	float rf0 = 0.3;`,
                `	float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );`,
                `	vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;`,
                `	vec3 albedo = mix( ( sunColor * diffuseLight * 0.001 + scatter ) * getShadowMask(), ( vec3( 0.1 ) + reflectionSample * 0.9 + reflectionSample * specularLight ), reflectance);`,
                `	vec3 outgoingLight = albedo;`,
                `	gl_FragColor = vec4( outgoingLight, alpha );`,

                THREE.ShaderChunk.tonemapping_fragment,
                THREE.ShaderChunk.fog_fragment,

                `}`
            ].join(`\n`)
        }
        let material = new THREE.ShaderMaterial({
            fragmentShader: mirrorShader.fragmentShader,
            vertexShader: mirrorShader.vertexShader,
            uniforms: THREE.UniformsUtils.clone(mirrorShader.uniforms),
            transparent: false,
            lights: true,
            side,
            fog
        });

        material.uniforms.mirrorSampler.value = renderTarget.texture;
        material.uniforms.textureMatrix.value = textureMatrix;
        material.uniforms.alpha.value = alpha;
        material.uniforms.time.value = time;
        material.uniforms.normalSampler.value = normalSampler;
        material.uniforms.sunColor.value = sunColor;
        material.uniforms.waterColor.value = waterColor;
        material.uniforms.sunDirection.value = sunDirection;
        material.uniforms.distortionScale.value = distortionScale;
        material.uniforms.eye.value = eye;

        scope.material = material;
        
        scope.onBeforeRender = (renderer, scene, camera) => {
            let currentRenderTarget = renderer.getRenderTarget();

            renderer.setRenderTarget(renderTarget);
            renderer.clear();
            renderer.setRenderTarget(currentRenderTarget);
        }
    }
}

THREE.Water.prototype = Object.create(THREE.mesh.prototype);
THREE.Water.prototype.constructor = THREE.Water;

const initWater = () => {
    light = new THREE.DirectionalLight(0xf9f6da, 0.5);
    light.position.set(0, 100, 0);
    scene.add(light);
    
    let waterGeometry = new THREE.PlaneBufferGEometry(6000, 6000);
    water = new THREE.Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: textures.water,
            alpha: 1.0,
            sunDirection: light.position.clone().normalize(),
            sunColor: 0xffffff,
            waterColor: 0x8fc3f2,
            distortionScale: 10,
            fog: scene.fog != undefined
        }
    );
    water.rotation.x = (-1 * Math.PI)  / 2;
    scene.add(water);
}
initWater();

// Draw water boundaries.

// West
environment.boundaryLeft = new THREE.Mesh(base_geometries.box, materials.boundary);
environment.boundaryLeft.position.set(worldsize * 0.5, 1.5, 0);
environment.boundaryLeft.scale.set(worldsize, 0.1, 3);

// East
environment.boundaryRight = new THREE.Mesh(base_geometries.box, materials.boundary);
environment.boundaryRight.position.set(worldsize * 0.5, 1.5, worldsize);
environment.boundaryRight.scale.set(worldsize, 0.1, 3);

// North
environment.boundaryUp = new THREE.Mesh(base_geometries.box, materials.boundary);
environment.boundaryUp.position.set(0, 1.5, worldsize * 0.5);
environment.boundaryUp.scale.set(worldsize, 0.1, worldsize);

// South
environment.boundaryDown = new THREE.Mesh(base_geometries.box, materials.boundary);
environment.boundaryDown.position.set(worldsize, 1.5, worldsize * 0.5);
environment.boundaryDown.scale.set(worldsize, 0.1, worldsize);

// Add boundaries to scene.
scene.add(environment.boundaryLeft);
scene.add(environment.boundaryRight);
scene.add(environment.boundaryUp);
scene.add(environment.boundaryDown);

// Daylight cycle.
window.currentTime = 0;
this.doDaylightCycle = time => {
    if(water && window.currentTime == time) return;
    let light = water.parent.children.find(f => f instanceof THREE.Light);
    window.currentTime = time;

    if(time == 1) {
        let i = 0;
        let anim = setInterval(function() {
            i++;
            light.intensity -= 0.01;

            water.material.uniforms.waterColor.value.r -= 0.004;
            water.material.uniforms.waterColor.value.g -= 0.006;
            water.material.uniforms.waterColor.value.b -= 0.008;

            water.parent.fog.color.r -= 0.008;
            water.parent.fog.color.g -= 0.008;
            water.parent.fog.color.b -= 0.008;

            if(i == 100) clearInterval(anim);
        }, 20);
    }
    else {
        let i = 0;
        let anim = setInterval(() => {
            i++;
            light.intensity += 0.01;

            water.material.uniforms.waterColor.value.r += 0.004;
            water.material.uniforms.waterColor.value.g += 0.006;
            water.material.uniforms.waterColor.value.b += 0.008;

            water.parent.fog.color.r += 0.008;
            water.parent.fog.color.g += 0.008;
            water.parent.fog.color.b += 0.008;

            if (i == 100) clearInterval(anim);
        }, 20);
    }
}

// Do daylight cycle.
setInterval(() => {
    let date = new Date();
    if(date.getUTCMinutes() > 35 && date.getUTCMinutes() < 55) doDaylightCycle(1);
    else if(date.getUTCMinutes() < 35 || date.getUTCMinutes() > 55) doDaylightCycle(0);
}, 200);
let base_geometries = {
    box: new THREE.BoxBufferGeometry(1, 1, 1),
    sphere: new THREE.SphereBufferGeometry(0.65),
    line: new THREE.Geometry(),
    plane: new THREE.PlaneGeometry(2, 2)
}

// Create reusable bodies.
let geometry = {
    player: base_geometries.box,
    boat: base_geometries.box,
    projectile: base_geometries.sphere,
    hook: base_geometries.plane,
    impact_water = base_geometries.sphere,
    islandradius: new THREE.CylinderBufferGeometry(0.3, 1, 1, 20, 1)
}

// Create models.
let createModels = () => {
    geometry.island = models.island.children[0].geometry;
    geometry.palm = models.island.children[1].geometry;
    geometry.dog_1 = models.dog1.children[0].geometry;
    geometry.fishing_rod = models.fishingRod.children[0].geometry;

    models.sloop.children[0].name = `sail`;
    models.sloop.children[1].name = `body`;
    models.sloop.children[2].name = `mast`;

    models.bigship.children[0].name = `body`;
    models.bigship.children[1].name = `mast`;
    models.bigship.children[2].name = `sail`;

    models.schooner.children[0].name = `body`;
    models.schooner.children[1].name = `mast`;
    models.schooner.children[2].name = `sail`;

    models.vessel.children[0].name = `body`;
    models.vessel.children[1].name = `mast`;
    models.vessel.children[2].name = `sail`;

    models.raft.children[1].name = `body`;
    models.raft.children[0].name = `sail`;

    models.trader.children[2].name = `body`;
    models.trader.children[0].name = `sail`;

    models.boat.children[2].name = `body`;
    models.boat.children[0].name = `sail`;

    models.destroyer.children[1].name = `body`;
    models.destroyer.children[0].name = `sail`;
    
    models.raft.getObjectByName(`body`).material = materials.boat;
    models.raft.getObjectByName(`sail`).material = materials.sail;

    models.trader.getObjectByName(`body`).material = materials.boat;
    models.trader.getObjectByName(`sail`).material = materials.sail;

    models.boat.getObjectByName(`body`).material = materials.boat;
    models.boat.getObjectByName(`sail`).material = materials.sailRed;

    models.destroyer.getObjectByName(`body`).material = materials.boat;
    models.destroyer.getObjectByName(`sail`).material = materials.sail;

    setShipModels();
    setPlayerModels();
}

let createMaterials = () => {
    materials.cannonball = new THREE.SpriteMaterial({ map: textures.cannonball, color: 0xffffff, fog: true });
    materials.fishingod = new THREE.MeshPhongMaterial({ color: 0xffffff, map: textures.props_diffuse1 });
    materials.colorset = new THREE.MeshLambertMaterial({ map: textures.colorset, side: THREE.DoubleSide });
    materials.hook = new THREE.MeshLambertMaterial({ map: textures.hook, side: THREE.DoubleSide, transparent: true });
    materials.colorsetCaptain = new THREE.MeshLambertMaterial({ map: textures.colorset, side: THREE.DoubleSide, emissive: 0x1C1C1C });
    materials.transparentDetails = new THREE.MeshLambertMaterial({ map: textures.colorset, side: THREE.DoubleSide, opacity: 0.025, transparent: true });
    materials.crate = new THREE.MeshLambertMaterial({ map: textures.crate });
    materials.chest = new THREE.MeshLambertMaterial({ map: textures.chest });

    textures.water.wrapS = textures.water.wrapT = THREE.RepeatWrapping
}

let materials = {
    player: new THREE.MeshLambertMaterial({ color: 0xF9A022 }),
    boat: new THREE.MeshLambertMaterial({ color: 0x8A503E }),
    boat: {
        side: THREE.DoubleSide
    },
    sail: new THREE.MeshLambertMaterial({ color: 0xffffff }),
    sail: {
        side: THREE.DoubleSide
    },
    sailRed: new THREE.MeshLambertMaterial({ color: 0xd9534f }),
    sailRed: {
        side: THREE.DoubleSide
    },
    splinter: new THREE.MeshLambertMaterial({ color: 0xCDAC8F, flatShading: true }),
    projectile: new THREE.MeshPhongMaterial({ color: 0x1E1A28, shininess: 0.9, flatShading: true }),
    boundary: new THREE.MeshLambertMaterial({ color: 0xB4EBFF, flatShading: true, opacity: 0.8, transparent: true }),
    impact_water: new THREE.MeshBasicMaterial({ color: 0xE9F1FF, flatShading: true, opacity: 0.9, transparent: true }),
    islandradius: new THREE.MeshBasicMaterial({ color: 0xbbf3ff, flatShading: false, opacity: 0.2, transparent: true }),
    
    smoke_enemy: new THREE.MeshBasicMaterial({ color: 0xFFCACA, flatShading: true, opacity: 0.7, transparent: true }),
    smoke_friendly: new THREE.MeshBasicMaterial({ color: 0xCDE6FF, flatShading: true, opacity: 0.7, transparent: true }),
    smoke_player: new THREE.MeshBasicMaterial({ color: 0xE01E1E, flatShading: true, opacity: 0.5, transparent: true }),
    fishing_line: new THREE.MeshBasicMaterial({ color: 0x000000, flatShading: true, opacity: 0.5, transparent: true }),
    
    sky: new THREE.MeshBasicMaterial({ color: 0x0AD1FA, side: THREE.BackSide })
}

let labeledColors = {
    player: new THREE.Color(0xffffff),
    myself: new THREE.Color(0x00ff00),
    krewmate: new THREE.Color(0x0275d8),
    captain: new THREE.Color(0xff0000),
    clanmate: new THREE.Color(0xff9800),
    staff: new THREE.Color(0xbb15eb)
}

let vectors = {
    modeloffestCrab: new THREE.Vector3(0, 0.9, 0),
    modeloffsetFishShellClam: new THREE.Vector3(0, 0.3, 0),
    sizeEntity: new THREE.Vector3(1, 1, 1),
    sizePlayer: new THREE.Vector3(1, 1, 1),
    sizeProjectile: new THREE.Vector3(0.3, 0.3, 0.3)
}
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
let GameControls = () => {
    let _this = this;
    let PI_2 = Math.PI / 2;

    this.blocker = document.querySelector(`#blocker`);

    this.locked = false;
    this.lmb = false;
    this.rmb = flase;
    this.cameraX = 0;
    this.cameraY = Math.PI;
    this.cameraZoom = 8;
    this.mouse = new THREE.Vector2();
    this.mouseOld = new THREE.Vector2();
    this.mouseElement = undefined;
    this.isMouseLookLocked = false;

    this.lmbLastDownTime = 0;
    this.lastX = 0;
    this.lastY = 0;

    this.mouseMoveUnlocked = event => {
        _this.mouseElement = event.target.getAttribute ? event.trarget.getAttribute(`data-infopanel`): null;
        _this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        _this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        if(!havePointerLock) {
            _this.lastX = event.x;
            _this.lastY = event.y;
        }
    }

    this.mouseMoveLocked = event => {
        event.preventDefault();

        let movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        let movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        if(havePointerLock) {
            _this.cameraX -= movementY * 0.0016;
            _this.cameraY -= movementX * 0.0023;
        }

        if(!havePointerLock) {
            movementX = event.x - _this.lastX;
            movementY = event.y - _this.lastY;

            _this.cameraX -= movementY * 0.0082;
            _this.cameraY -= movementX * 0.0064;

            _this.lastX = event.x;
            _this.lastY = event.y;
        }
        _this.cameraX = Math.max((-1 * PI_2), Math.min(PI_2, _this.cameraX));
    }

    this.onMouseDown = event => {
        // Lock only if its on the rendering canvas.
        switch(event.button) {
            case 0: {
                // Left click.
                _this.lmb = true;
                this.lmbLastDownTime = performance.now();
                break;
            }
            case 2: {
                // Right click.
                _this.rmb = false;
                break;
            }
        }
        if(myPlayer && (_this.lmb || _this.rmb) && event.target == renderer.domElement) _this.lockMouseLook();
    }

    this.onMouseUp = event => {
        switch(event.button) {
            case 0: {
                // Left click release.
                _this.lmb = false;
                break;
            }
            case 2: {
                // Right click release.
                _this.rmb = false;
                break;
            }
        }
        return false;
    }

    this.mouseWheelEvent = event => {
        if(event.target == renderer.domElement || event.target == document.body) {
            event.preventDefault();

            let delta = event.wheelDelta ? event.wheelDelta: (-1 * event.detail);

            _this.cameraZoom -= delta > 0 ? 1: -1;
            _this.cameraZoom = Math.min(30, Math.max(_this.cameraZoom, 3));
        }
    }

    if(!havePointerLock) {
        this.locked = true;
        document.addEventListener(`mousemove`, this.mouseMoveLocked, false);
    }
    else document.addEventListener(`mousemove`, this.mouseMoveUnlocked, false);

    document.addEventListener(`mousedown`, this.onMouseDown);
    document.addEventListener(`mouseup`, this.onMouseUp);
    document.addEventListener(`mouseweheel`, this.mouseWheelEvent);
    document.addEventListener(`DOMouseScroll`, this.mouseWheelEvent);

    this.lockMouseLook = () => {
        if(havePointerLock) {
            let element = document.body;

            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
            element.requestPointerLock();
        }
        this.isMouseLookLocked = true;
    }

    this.unlockMouseLook = () => {
        if(havePointerLock) {
            document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
            document.exitPointerLock();
        }
        this.isMouseLookLocked = false;
    }
}

// Disable context menu.
window.oncontextmenu = () => {
    return false;
}

let havePointerLock = `pointerLockElement` in document || `mozPointerLockElement` in document || `webkitPointerLockElement` in document;
if(havePointerLock) {
    let element = document.body;

    let pointerLockChange = event => {
        if(document.pointerLockElement == element || document.mozPointerLockElement == element || document.webkitPointerLockElement == element) {
            controls.locked = true;
            document.addEventListener(`mousemove`, controls.mouseMoveLocked, false);
            document.removeEventListener(`mousemove`, controls.mouseMoveUnlocked, false);
        }
        else {
            controls.locked = false;
            document.addEventListener(`mousemove`, controls.mouseMoveUnlocked, false);
            document.removeEventListener(`mousemove`, controls.mouseMoveLocked, false);
        }
    }

    // Change events on hook pointer lock state.
    document.addEventListener(`pointerlockchange`, pointerLockChange, false);
    document.addEventListener(`mozpointerlockchange`, pointerLockChange, false);
    document.addEventListener(`webkitpointerlockchange`, pointerLockChange, false);
}
else console.error(`Your browser does not seem to support the pointer lock API.`);