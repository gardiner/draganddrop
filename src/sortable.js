(function($) {
"use strict";


function Sortable(el, options) {
    var DEFAULTS = {
            nodes: (el.nodeName == 'OL' || el.nodeName == 'UL') ? 'LI' : 'DIV'
        };
    options = $.extend(DEFAULTS, options);

    //TODO: check if needed here
    $('html')
    .addClass('unselectable')
    .attr('unselectable','on')
    .on('selectstart', function() { return false; });

    $(el)
    .addClass('sortable')
    .find(options.nodes).each(function(ix, node) {
        var $node = $(node),
            $clone,
            $placeholder,
            dragorigin;

        $node.draggable({
            dragstart: function(evt) {
                console.log($node.text().trim());
                $clone = $node.clone().addClass('detached').appendTo($node.parent()).offset($node.offset());
                $placeholder = $('<' + options.nodes + '/>').addClass('placeholder').css({height: $node.outerHeight(), width: $node.outerWidth()}).insertAfter($node);
                $node.hide();
                dragorigin = $clone.offset();
            },
            drag: function(evt, delta) {
                $clone.offset({top: dragorigin.top + delta.dy, left: dragorigin.left + delta.dx});
            },
            dragstop: function(evt) {
                if ($clone) {
                    $clone.remove();
                }
                if ($placeholder) {
                    $placeholder.remove();
                }
                dragorigin = null;
                $clone = null;
                $placeholder = null;
                $node.show();
            }
        });
    });
}

/**
 * Sortable plugin.
 */
$.fn.sortable = function(options) {
    //TODO: specific commands?
    //TODO: check if already applied?
    return this.each(function(ix, el) {
        new Sortable(el, options);
    });
};


function Draggable(el, options) {
    var pos = null,
        $el = $(el);

    function start(evt) {
        evt.stopPropagation();
        pos = $.pos(evt);
        if (options.dragstart) {
            options.dragstart.call($el, evt);
        }
    }

    function end(evt) {
        evt.stopPropagation();
        pos = false;
        if (options.dragstop) {
            options.dragstop.call($el, evt);
        }
    }

    function move(evt) {
        evt.stopPropagation();
        var p = $.pos(evt);
        if (pos && options.drag) {
            options.drag.call($el, evt, {dx: p.x - pos.x, dy: p.y - pos.y});
        }
    }

    $el
    .on('touchstart mousedown', start)

    $(document)
    .on('touchend mouseup', end)
    .on('touchmove mousemove', move);
}

/**
 * Draggable plugin.
 */
$.fn.draggable = function(options) {
    return this.each(function(ix, el) {
        new Draggable(el, options);
    });
};

/**
 * Event pos helper.
 */
$.pos = function(evt) {
    evt = window.hasOwnProperty('event') ? window.event : evt;
    evt = evt.hasOwnProperty('touches') ? evt.touches[0] : evt;
    return {x: evt.pageX, y: evt.pageY};
};




}(jQuery));