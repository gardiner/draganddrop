(function($) {
"use strict";


function Sortable(el, options) {
    //TODO: drag handle
    var self = this,
        $sortable = $(el),
        container_type = $sortable[0].nodeName,
        node_type = (container_type == 'OL' || container_type == 'UL') ? 'LI' : 'DIV',
        defaults = {
            //options
            container: container_type,
            container_type: container_type,
            nodes: node_type,
            nodes_type: node_type,
            auto_container_class: 'sortable_container',
            autocreate: false,
            group: false,
            //callbacks
            update: null
        };

    self.$sortable = $sortable.data('sortable', self);
    self.options = $.extend({}, defaults, options);

    self.init();
}

Sortable.prototype.invoke = function(command) {
    var self = this;
    if (command === 'destroy') {
        return self.destroy();
    } else if (command === 'serialize') {
        return self.serialize(self.$sortable);
    }
};

Sortable.prototype.init = function() {
    var self = this;

    $('html').unselectable();

    self.$sortable
    .addClass('sortable')
    .on('destroy.sortable', function() {
        self.destroy();
    });

    self.find_nodes().each(function(ix, node) {
        self.init_node(node);
    });
};

Sortable.prototype.destroy = function() {
    var self = this;

    $('html').unselectable('destroy');

    self.$sortable
    .removeClass('sortable')
    .off('.sortable');

    self.find_nodes().each(function(ix, node) {
        self.destroy_node(node);
    });
};

Sortable.prototype.init_node = function(node) {
    var self = this,
        $node = $(node),
        $clone,
        $placeholder,
        position;

    function find_insert_point(pos) {
        var containers,
            best;

        if (!pos) {
            return;
        }

        containers = self.$sortable
        .add(self.$sortable.find(self.options.container))
        .not($node.find(self.options.container))
        .not($clone.find(self.options.container))
        .not(self.find_nodes());

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

    $node.dragaware({
        /**
         * drag start - create clone and placeholder, keep drag start position.
         */
        dragstart: function(evt) {
            $clone = $node.clone()
                          .addClass('sortable_clone')
                          .insertAfter($node)
                          .offset($node.offset());
            $placeholder = self.create_placeholder()
                               .css({height: $node.outerHeight(), width: $node.outerWidth()})
                               .insertAfter($node);
            $node.hide();

            position = new PositionHelper($clone.offset());

            if (self.options.autocreate) {
                self.find_nodes().filter(function(ix, el) {
                    return $(el).find(self.options.container).length == 0;
                }).append('<' + self.options.container_type + ' class="' + self.options.auto_container_class + '"/>');
            }
        },

        /**
         * drag - reposition clone, check for best insert position, move placeholder in dom accordingly.
         */
        drag: function(evt, delta) {
            var pos = position.absolutize(delta),
                best = find_insert_point(pos);

            $clone.offset(pos);
            $placeholder.nthChild(best.container, best.n);
        },

        /**
         * drag stop - clean up.
         */
        dragstop: function(evt, delta) {
            var pos = position.absolutize(delta),
                best = find_insert_point(pos);

            if (best) {
                $node.nthChild(best.container, best.n);
            }
            $node.show();

            if ($clone) {
                $clone.remove();
            }
            if ($placeholder) {
                $placeholder.remove();
            }
            $clone = null;
            $placeholder = null;

            if (best && self.options.update) {
                self.options.update.call(self.$sortable, evt, self);
            }
            self.$sortable.trigger('update');
        }
    });
};

Sortable.prototype.destroy_node = function(node) {
    $(node).dragaware('destroy');
};

Sortable.prototype.serialize = function(container) {
    var self = this;
    return container.children(self.options.nodes).not(self.options.container).map(function(ix, el) {
        var $el = $(el),
            text = $el.clone().children().remove().end().text().trim(), //text only without children
            id = $el.attr('id'),
            node = {id: id || text};
        if ($el.find(self.options.nodes).length) {
            node.children = self.serialize($el.children(self.options.container));
        }
        return node;
    }).get();
};

Sortable.prototype.find_nodes = function() {
    var self = this;
    return self.$sortable.find(self.options.nodes).not(self.options.container);
};

Sortable.prototype.create_placeholder = function() {
    var self = this;
    return $('<' + self.options.nodes_type + '/>').addClass('sortable_placeholder');
};

Sortable.prototype.square_dist = function(pos1, pos2) {
    return Math.pow(pos2.left - pos1.left, 2) + Math.pow(pos2.top - pos1.top, 2);
};




function Draggable(el, options) {
    //TODO: drag handle
    var self = this,
        defaults = {
            //options
            revert: false,
            placeholder: false,
            droptarget: false,
            //callbacks
            update: null,
            drop: null
        };

    self.$draggable = $(el).data('draggable', self);
    self.options = $.extend({}, defaults, options);

    self.init();
}

Draggable.prototype.init = function() {
    var self = this,
        $clone,
        $placeholder,
        position;

    self.$draggable
    .addClass('draggable')
    .on('destroy.draggable', function() {
        self.destroy();
    });

    function check_droptarget(pos) {
        var $over;

        $('.hovering').removeClass('hovering');

        $clone.hide();
        $over = $(document.elementFromPoint(pos.x, pos.y)).closest(self.options.droptarget);
        $clone.show();

        if ($over.length) {
            $over.addClass('hovering');
            return $over;
        }
    }

    self.$draggable.dragaware({
        /**
         * drag start - create clone and placeholder, keep drag start position.
         */
        dragstart: function(evt) {
            if (self.options.placeholder) {
                $placeholder = self.create_clone('draggable_placeholder');
            }

            if (self.options.revert) {
                $clone = self.create_clone('draggable_clone');
                self.$draggable.invisible();
            } else {
                $clone = self.$draggable;
            }

            position = new PositionHelper($clone.offset());
        },

        /**
         * drag - reposition clone.
         */
        drag: function(evt, delta, pos) {
            var $droptarget = check_droptarget(pos);
            $clone.offset(position.absolutize(delta));
        },

        /**
         * drag stop - clean up.
         */
        dragstop: function(evt, delta, pos) {
            var $droptarget = check_droptarget(pos);

            if (self.options.placeholder) {
                $placeholder.remove();
            }

            if (self.options.revert) {
                $clone.remove();
                self.$draggable.visible();
            }

            $clone = null;
            $placeholder = null;

            if (self.options.update) {
                self.options.update.call(self.$draggable, evt, self);
            }

            self.$draggable.trigger('update');

            if ($droptarget) {
                if (self.options.drop) {
                    self.options.drop.call(self.$draggable, evt, $droptarget[0]);
                }
                $droptarget.trigger('drop');
                $droptarget.removeClass('hovering');
            }
        }
    });
};

Draggable.prototype.destroy = function() {
    var self = this;

    self.$draggable
    .dragaware('destroy')
    .removeClass('draggable')
    .off('.draggable');
};

Draggable.prototype.create_clone = function(classname) {
    var self = this;
    return self.$draggable
    .clone()
    .addClass(classname)
    .insertAfter(self.$draggable)
    .offset(self.$draggable.offset());
};




function Dragaware(el, options) {
    var $dragaware = $(el),
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
                options.dragstart.call($dragaware, evt);
            }

            $dragaware.addClass('dragging');
            $dragaware.trigger('dragstart');

            //late binding of event listeners
            $(document)
            .on('touchend.dragaware mouseup.dragaware click.dragaware', end)
            .on('touchmove.dragaware mousemove.dragaware', move);
        }
    }

    function move(evt) {
        if (pos && options.drag) {
            evt.stopPropagation();
            lastpos = relpos(evt);
            options.drag.call($dragaware, evt, lastpos, evtpos(evt));
        }
    }

    function end(evt) {
        if (pos && options.dragstop) {
            evt.stopPropagation();
            options.dragstop.call($dragaware, evt, lastpos, evtpos(evt));
        }
        pos = false;
        lastpos = false;

        $dragaware.removeClass('dragging');
        $dragaware.trigger('dragstop');

        //unbinding of event listeners
        $(document)
        .off('.dragaware');
    }

    $dragaware
    .addClass('dragaware')
    .on('touchstart.dragaware mousedown.dragaware', start);

    $dragaware.on('destroy.dragaware', function() {
        $dragaware
        .removeClass('dragaware')
        .off('.dragaware');
    });
}




function PositionHelper(origin) {
    this.origin = origin;
}
PositionHelper.prototype.absolutize = function(relpos) {
    if (!relpos) {
        return this.origin;
    }
    return {top: this.origin.top + relpos.dy, left: this.origin.left + relpos.dx};
};




// Plugin registration.


/**
 * Sortable plugin.
 */
$.fn.sortable = function(options) {
    var filtered = this.not(function() {
            return $(this).is('.sortable') || $(this).closest('.sortable').length;
        });

    if (this.data('sortable') && typeof options === 'string') {
        return this.data('sortable').invoke(options);
    }

    if (filtered.length && options && options.group) {
        new Sortable(filtered, options);
    } else {
        filtered.each(function(ix, el) {
            new Sortable(el, options);
        });
    }
    return this;
};


/**
 * Draggable plugin.
 */
$.fn.draggable = function(options) {
    if (options === 'destroy') {
        this.trigger('destroy.draggable');
    } else {
        this.not('.draggable').each(function(ix, el) {
            new Draggable(el, options);
        });
    }
    return this;
};


/**
 * Dragaware plugin.
 */
$.fn.dragaware = function(options) {
    if (options === 'destroy') {
        this.trigger('destroy.dragaware');
    } else {
        this.not('.dragaware').each(function(ix, el) {
            new Dragaware(el, options);
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


$.fn.invisible = function() {
    return this.css({visibility: 'hidden'});
};


$.fn.visible = function() {
    return this.css({visibility: 'visible'});
};


}(jQuery));