/*
 * 	Delta Template Framework
 *  Client Side JavaScript based HTML templating system
 *  
 *	Copyright (c) Carlos Morgado 2008
 *  Licensed under the GNU General Public License (GPL)
 */


/*
 * INCLUDE jQuery
 *
 * Template Language
 * map: <span class='deltemp_$foo'>
 * include html: <div class='deltemp_include_subtemplate.html'>
 * conditional removal: <div class='deltemp_test_var'>
 * 
 * $foo can be:
 * 	* a string/number, 
 * 	* Array of string/numbers in which case the Arrays elems get maped onto clones of the html element
 * 	* Array of dictionaries in which case each dictinary is maped onto a clone of the html block
 **/


/*
 *	lifted from http://zealdev.wordpress.com/2008/04/15/jquery-template-engine/
 *	which in turn lifted it from mootools
 *	nothing is original anymore
 */
function $type(obj){
    if (obj == undefined) 
        return false;
    if (obj.htmlElement) 
        return 'element';
    var type = typeof obj;
    if (type == 'object' && obj.nodeName) {
        switch (obj.nodeType) {
            case 1:
                return 'element';
            case 3:
                return (/\S/).test(obj.nodeValue) ? 'textnode' : 'whitespace';
        }
    }
    if (type == 'object' || type == 'function') {
        switch (obj.constructor) {
            case Array:
                return 'array';
            case RegExp:
                return 'regexp';
        }
        if (typeof obj.length == 'number') {
            if (obj.item) 
                return 'collection';
            if (obj.callee) 
                return 'arguments';
        }
    }
    return type;
};
/* end of lifted code */

function $updateID(e, n){
	$(e).attr('id', $(e).attr('id') + 'd' + n);
}

DeltaTemp = function(ns, curtains){
    this._ns = ns;
    this._curtains = curtains;
 
 	this.treeroot = $('body');
 
    this._procs = {};
    this.nextid = 0;
	
    this.init();
};

DeltaTemp.prototype = DeltaTemp.fn = {
    dprefix: 'deltatemp',
    _dpregex: '*[className^="deltatemp"]',
    
    init: function(){
        /*        var cssObj = {
         position: "absolute",
         top: 0,
         left: 0,
         width: "100%",
         height: "100%",
         background: "yellow",
         'z-index': 99,
         'text-align': "center"
         }
         $('body').append('<div id="deltatempcurtain">loading ...</div>');
         $('#deltatempcurtain').css(cssObj).show();
         */
        this._dropCurtain();
    },
    
    processDocument: function(){
        this.processTree($('body'));
    },
    
	processTree: function(node, id) {
        if (!id) {
            id = 0;
        };
        this._procs[id] = 1;
        this.nextid = id + 1;
        
//		this.treeroot = node;
		
        var that = this;
        
        $(node).find(this._dpregex).each(function(i){
			that.processNode(this, i);
        });
        delete (this._procs[id]);
        this._raiseCurtain();
		
	},
	
    processNode: function(node, id){        
        var inst = this._parseCommand($(node));
		if(!inst) {
			return;
		}
            if (inst.op == '$') {
                this._processNodeMapVar(node, inst.param);
            }
            else 
                if (inst.op == 'include') {
					if(inst.param.substr(0,1) == '$') {
	                    this._processNodeIncludeHtml(node, this._ns[inst.param.substr(1)]);
					} else
	                    this._processNodeIncludeHtml(node, inst.param);
                }
                else 
                    if (inst.op == 'test') {
                        this._processNodeTestVar(node, inst.param);
                    }
    },
    
    _processNodeMapVar: function(elem, v){
        var worker = function(that, r){
            switch ($type(r)) {
                case 'array':
                    for (n = r.length - 1; n > -1; n--) {
                        var e = $(elem).clone();
						$updateID(e,n);
                        switch ($type(r[n])) {
                            case 'object':
                                e.addClass(that.dprefix + '_+' + that._getCode(e));
								that._fullns = that._ns;
								that._ns = r[n];
								that.processTree(e);
								that._ns = that._fullns;
								e.find(that._dpregex).each(function () {
									$updateID(this,n);
								});
                                break;
                            default:
                                e.text(r[n]);
                        }
						if (n > 0) {
							e.addClass('deltatempgenerated');
						}
                        e.insertAfter($(elem));
                    }
                    $(elem).remove(); // here, we cheat. everything is cloned, we just pretend the first isn't
                    break;
                case 'function':
                    worker(that, r(elem));
                    break;
                case false:
                    /* doesn't exist */
                    break;
                default:
                    $(elem).text(r);
            }
        };
        worker(this, this._ns[v]);
    },
    
    _processNodeIncludeHtml: function(elem, p){
        var that = this;
        this._procs[this.nextid] = 1;
        $(elem).load(p, function(){
            $(elem).addClass(this.dprefix + '+' + p);
            that.processTree($(elem), this.nextid);
        });
    },
    
    _processNodeTestVar: function(elem, v){
        var r = false;
        switch ($type(this._ns[v])) {
            case 'array':
                /* grab the first value, whatever */
                r = this._ns[v][0];
                break;
            case 'function':
                r = this._ns[v](elem);
                break;
            case false:
                /* doesn't exist */
                break;
            default:
                r = this._ns[v];
        }
        if (!r) {
			$(elem).data('display', $(elem).css('display') );
            $(elem).css('display','none');
			$(elem).addClass('deltatempremoved');
        } else if($(elem).hasClass('deltatempremoved')) {
			$(elem).css('display', $(elem).data('display') );
			$(elem).removeClass('deltatempremoved');
			$(elem).removeData('display');
		}
        
    },
    
	// only used once, replace with parseCommand in the future
    _getCode: function(e){
        var that = this;
        return $(e).attr('className').split(' ').filter(function(el){
            return el.substr(0, that.dprefix.length) == that.dprefix;
        })[0].substr(that.dprefix.length + 1);
    },
    
	_parseCommand: function(e) {
		var that = this;
        var s = $(e).attr('className').split(' ').filter(function(el){
            return el.substr(0, that.dprefix.length) == that.dprefix;
        })[0];
		var res = {};
		if(s) {
			var a = s.split(/_/);
			if (a[1].substr(0, 1) == '$') {
				res.op = a[1].substr(0, 1);
				res.param = a[1].substr(1);
			}
			else {
				res = {
					'op': a[1],
					'param': a[2]
				};
			}
		} else {
			res = false;
		} 

			return res;
	},
	
	updateValues: function (name) {
		var that = this;
		var f;
		var inst;
		
		var objs = $('body').find(this._dpregex).filter(function(i){
			var r = false;
			inst = that._parseCommand(this);
			if(inst) {
				switch(inst.op) {
					case 'include':
					r = (inst.param == '$'+name);
					break;
					default:
					r = (inst.param == name);
				}
			}
			return r;
        });
//		var objs = $('body').find('[class~='+that.dprefix+'_$'+name+']');
		switch($type(this._ns[name])) {
			case false:
				// var doesn't exist
				return;
			case 'array':
				f = function(e){
					that.processTree(e)
				};
				objs = objs.parent();
				objs.find('.deltatempgenerated').each(function () {$(this).remove()});
				break;
			default:
				if (ins.op == 'test') {
					f = function(e) {
						that.processTree(e);
						that.processNode(e);
					}
				} else {
					f = function(e){
						that.processNode(e)
					};
				}
		}
		objs.each(function() {f(this)});		
	},
	
    _dropCurtain: function(){
        if (!this._curtains) {
            return
        };
        $(this.treeroot).hide();
    },
    
    _raiseCurtain: function(){
        if (!this._curtains) {
            return
        };
        var np = 0;
        for (var i in this._procs) {
            np++
        };
        if (np == 0) {
            /*            $('#deltatempcurtain').slideUp();*/
            $(this.treeroot).fadeIn("slow");
        }
    }
}
