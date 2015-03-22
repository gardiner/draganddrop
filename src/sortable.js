(function($) {
"use strict";


function Sortable(el, options) {
    var DEFAULTS = {
            container: el.nodeName,
            nodes: (el.nodeName == 'OL' || el.nodeName == 'UL') ? 'LI' : 'DIV',
            autocreate: false
        },
        $sortable = $(el);

    options = $.extend(DEFAULTS, options);

    function placeholder() {
        return $('<' + options.nodes + '/>').addClass('placeholder');
    }

    function square_dist(pos1, pos2) {
        var dist = Math.pow(pos2.left - pos1.left, 2) + Math.pow(pos2.top - pos1.top, 2);
        return dist;
    }

    //TODO: check if needed here
    $('html')
    .addClass('unselectable')
    .attr('unselectable','on')
    .on('selectstart', function() { return false; });

    $sortable
    .addClass('sortable')
    .find(options.nodes).each(function(ix, node) {
        var $node = $(node),
            $clone,
            $placeholder,
            dragorigin;

        function abspos(delta) {
            return {top: dragorigin.top + delta.dy, left: dragorigin.left + delta.dx};
        }

        function insert_point(pos) {
            var containers,
                best;

            containers = $sortable
            .add($sortable.find(options.container))
            .not($node.find(options.container))
            .not($clone.find(options.container));

            $placeholder.hide();
            containers.each(function(ix, container) {
                var childnum = $(container).children().length,
                    n,
                    candidate,
                    dist;

                for (n = 0; n <= childnum; n++) {
                    candidate = placeholder().nthChild(container, n);
                    dist = square_dist(candidate.offset(), pos);
                    candidate.remove();

                    if (!best || best.dist > dist) {
                        best = {container: container, n: n, dist: dist};
                    }
                }
            });
            $placeholder.show();

            return best;
        }

        $node.draggable({
            /**
             * drag start - create clone and placeholder, keep drag start position.
             */
            dragstart: function(evt) {
                //visual clone to show drag position
                $clone = $node.clone().addClass('detached').appendTo($node.parent()).offset($node.offset());
                //placeholder to show insert position
                $placeholder = placeholder().css({height: $node.outerHeight(), width: $node.outerWidth()}).insertAfter($node);
                //hide actual node
                $node.hide();
                //drag origin
                dragorigin = $clone.offset();

                if (options.autocreate) {
                    //add sublists
                    $sortable.find(options.nodes).filter(function(ix, el) {
                        return $(el).find(options.container).length == 0;
                    }).append('<' + options.container + ' class="insert"/>');
                }
            },
            /**
             * drag - position clone, check for best insert position, move placeholder in dom accordingly.
             */
            drag: function(evt, delta) {
                var pos = abspos(delta),
                    best = insert_point(pos);

                $clone.offset(pos);
                $placeholder.nthChild(best.container, best.n);
            },
            /**
             * drag stop - clean up.
             */
            dragstop: function(evt, delta) {
                var pos = abspos(delta),
                    best = insert_point(pos);

                //move actual node
                $node.nthChild(best.container, best.n).show();

                //cleanup
                if ($clone) {
                    $clone.remove();
                }
                if ($placeholder) {
                    $placeholder.remove();
                }
                dragorigin = null;
                $clone = null;
                $placeholder = null;
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

    function evtpos(evt) {
        evt = window.hasOwnProperty('event') ? window.event : evt;
        evt = evt.hasOwnProperty('touches') ? evt.touches[0] : evt;
        return {x: evt.pageX, y: evt.pageY};
    }

    function relpos(evt) {
        var p = evtpos(evt);
        return {dx: p.x - pos.x, dy: p.y - pos.y};
    }

    function start(evt) {
        evt.stopPropagation();
        pos = evtpos(evt);
        if (options.dragstart) {
            options.dragstart.call($el, evt);
        }
    }

    function end(evt) {
        evt.stopPropagation();
        if (pos && options.dragstop) {
            options.dragstop.call($el, evt, relpos(evt));
        }
        pos = false;
    }

    function move(evt) {
        evt.stopPropagation();
        if (pos && options.drag) {
            options.drag.call($el, evt, relpos(evt));
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
 * Inserts the current selection as nth child into first element matching selector.
 */
$.fn.nthChild = function(selector, n) {
    var $container = $(selector).eq(0),
        $children = $container.children();
    if (n == 0) {
        $container.prepend(this);
    } else if (n >= $children.length) {
        $container.append(this);
    } else {
        $children.eq(n).before(this);
    }
    return this;
};


}(jQuery));