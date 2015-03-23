(function($) {
"use strict";


function Sortable(el, options) {
    //TODO: drag handle
    var self = this,
        $sortable = $(el),
        container = $sortable[0].nodeName,
        defaults = {
            container: container,
            nodes: (container == 'OL' || container == 'UL') ? 'LI' : 'DIV',
            autocreate: false
        };

    self.$sortable = $sortable;
    self.options = $.extend({}, defaults, options);

    self.init();

    self.$sortable.on('destroy.sortable', function() {
        self.destroy();
    });
}

Sortable.prototype.init = function() {
    var self = this;

    $('html').unselectable();

    self.$sortable.addClass('sortable');
    self.find_nodes().each(function(ix, node) {
        self.init_node(node);
    });
};

Sortable.prototype.destroy = function() {
    var self = this;

    $('html').unselectable('destroy');

    self.$sortable.removeClass('sortable');
    self.find_nodes().each(function(ix, node) {
        self.destroy_node(node);
    });
};

Sortable.prototype.init_node = function(node) {
    var self = this,
        $node = $(node),
        $clone,
        $placeholder,
        dragorigin;

    function abspos(delta) {
        if (!delta) {
            return;
        }

        return {top: dragorigin.top + delta.dy, left: dragorigin.left + delta.dx};
    }

    function find_insert_point(pos) {
        var containers,
            best;

        if (!pos) {
            return;
        }

        containers = self.$sortable
        .add(self.$sortable.find(self.options.container))
        .not($node.find(self.options.container))
        .not($clone.find(self.options.container));

        $placeholder.hide();
        containers.each(function(ix, container) {
            var childnum = $(container).children().length,
                n,
                candidate,
                dist;

            for (n = 0; n <= childnum; n++) {
                candidate = self.create_placeholder().nthChild(container, n);
                dist = self.square_dist(candidate.offset(), pos);
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
            $placeholder = self.create_placeholder().css({height: $node.outerHeight(), width: $node.outerWidth()}).insertAfter($node);
            //hide actual node
            $node.hide();
            //drag origin
            dragorigin = $clone.offset();

            if (self.options.autocreate) {
                //add sublists
                self.find_nodes().filter(function(ix, el) {
                    return $(el).find(self.options.container).length == 0;
                }).append('<' + self.options.container + ' class="insert"/>');
            }
        },

        /**
         * drag - position clone, check for best insert position, move placeholder in dom accordingly.
         */
        drag: function(evt, delta) {
            var pos = abspos(delta),
                best = find_insert_point(pos);

            $clone.offset(pos);
            $placeholder.nthChild(best.container, best.n);
        },

        /**
         * drag stop - clean up.
         */
        dragstop: function(evt, delta) {
            var pos = abspos(delta),
                best = find_insert_point(pos);

            //move actual node
            if (best) {
                $node.nthChild(best.container, best.n);
            }
            $node.show();

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
};

Sortable.prototype.destroy_node = function(node) {
    $(node).draggable('destroy');
};

Sortable.prototype.find_nodes = function() {
    var self = this;
    return self.$sortable.find(self.options.nodes);
};

Sortable.prototype.create_placeholder = function() {
    var self = this;
    return $('<' + self.options.nodes + '/>').addClass('placeholder');
};

Sortable.prototype.square_dist = function(pos1, pos2) {
    return Math.pow(pos2.left - pos1.left, 2) + Math.pow(pos2.top - pos1.top, 2);
};


/**
 * Sortable plugin registration.
 */
$.fn.sortable = function(options) {
    var filtered = this.not(function() {
            return $(this).is('.sortable') || $(this).closest('.sortable').length;
        });

    if (typeof options === 'string') {
        this.trigger(options + '.sortable');
    } else if (filtered.length && options && options.group) {
        new Sortable(filtered, options);
    } else {
        filtered.each(function(ix, el) {
            new Sortable(el, options);
        });
    }
    return this;
};



function Draggable(el, options) {
    var $draggable = $(el),
        pos = null,
        lastpos = null;

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
        if (evt.type == 'touchstart' || evt.button == 0) {
            evt.stopPropagation();
            pos = evtpos(evt);
            if (options.dragstart) {
                options.dragstart.call($draggable, evt);
            }

            //late binding of event listeners
            $(document)
            .on('touchend.draggable mouseup.draggable click.draggable', end)
            .on('touchmove.draggable mousemove.draggable', move);
        }
    }

    function move(evt) {
        if (pos && options.drag) {
            evt.stopPropagation();
            lastpos = relpos(evt);
            options.drag.call($draggable, evt, lastpos);
        }
    }

    function end(evt) {
        if (pos && options.dragstop) {
            evt.stopPropagation();
            options.dragstop.call($draggable, evt, lastpos);
        }
        pos = false;
        lastpos = false;

        //unbinding of event listeners
        $(document)
        .off('.draggable');
    }

    $draggable
    .addClass('draggable')
    .on('touchstart.draggable mousedown.draggable', start);

    $draggable.on('destroy.draggable', function() {
        $draggable
        .removeClass('draggable')
        .off('.draggable');
    });
}


/**
 * Draggable plugin registration.
 */
$.fn.draggable = function(options) {
    if (typeof options === 'string') {
        this.trigger(options + '.draggable');
    } else {
        this.not('.draggable').each(function(ix, el) {
            new Draggable(el, options);
        });
    }
    return this;
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

/**
 * Disables mouse selection.
 */
$.fn.unselectable = function(command) {
    function disable() {
        return false;
    }

    if (command == 'destroy') {
        return this
        .removeClass('unselectable')
        .removeAttr('unselectable')
        .off('selectstart.unselectable');
    } else {
        return this
        .addClass('unselectable')
        .attr('unselectable','on')
        .on('selectstart.unselectable', disable);
    }
};


}(jQuery));