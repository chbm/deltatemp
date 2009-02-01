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
    this._curtains = curtains == undefined ? true : curtains;
 
    this._procs = {};
    this.nextid = 0;
	
	this.preproc = this.postproc = undefined;
	
	
	this._elemCache = {};
	
    this.init();
};

DeltaTemp.prototype = DeltaTemp.fn = {
    dprefix: 'deltatemp',
    _dpregex: '[className*="deltatemp_"]',
    
    init: function(){
    },
    
    processDocument: function(){
        this._dropCurtain();
        this.processTree($('body'));
    },
    
	processTree: function(node, id) {
        if (!id) {
            id = 0;
        };
        this._procs[id] = 1;
        this.nextid = id + 1;
        
		this.treeroot = node;
		
        var that = this;
        
        $(node).find(this._dpregex).each(function(i){
			that.processNode(this, i);
        });
		
        delete (this._procs[id]);
        this._raiseCurtain();
		
	},
	
    processNode: function(node, id){    
		var jnode = $(node);    
        var inst = this._parseCommand(jnode);
        if (!inst) {
            return;
        }
        
        if (this.preproc) {
            this.preproc(jnode, inst.param);
        }
        if (inst.op == '$') {
            this._processNodeMapVar(jnode, inst.param);
        }
        else if (inst.op == 'include') {
            if (inst.param.substr(0, 1) == '$') {
                this._processNodeIncludeHtml(jnode, this._ns[inst.param.substr(1)]);
            }
            else 
                this._processNodeIncludeHtml(jnode, inst.param);
        }
        else if (inst.op == 'test') {
            this._processNodeTestVar(jnode, inst.param);
        }
        if (this.postproc) {
            this.postproc(jnode, inst.param);
        }
    },
    
    _processNodeMapVar: function(elem, v){
        var worker = function(that, r){
			if (!r) return;
            switch ($type(r)) {
                case 'array':
					var code = that._getCode(elem);
					var proto = $(elem).clone();
					proto.addClass(that.dprefix + '+_' + code);
					proto.removeClass(that.dprefix + '_' + code);
					proto.addClass('deltatempgenerated');
					var e;
					var n = n = r.length - 1;
                    while(n > -1) {
                        e = $(proto).clone();
						$updateID(e,n);
                        switch ($type(r[n])) {
                            case 'object':
								var dtt = new DeltaTemp(r[n]);
								dtt.processTree(e);
								e.find(that._dpregex).each(function () {
									$updateID(this,n);
								});
								if(r[n]._id) {
									if ($type(r[n]._id) == 'function') {
										e.attr('id', r[n]._id(e, n));										
									}
									else {
										e.attr('id', r[n]._id);
									}
								}
                                break;
                            default:
                                e.text(r[n]);
                        }
                        e.insertAfter($(elem));
						n--;
                    }
                    if (r.length) {
						$(elem).remove(); // here, we cheat. everything is cloned, we just pretend the first isn't
						e.removeClass('deltatempgenerated');
						e.removeClass(that.dprefix + '+_' + code);
						e.addClass(that.dprefix + '_' + code);
					}
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
                r = this._ns[v].length;
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
		var jElem = $(elem);
        if (!r) {
			if (!jElem.hasClass('deltatempremoved')) {
				this._elemCache[jElem.attr('id')] = jElem.css('display') ;
            	jElem.css('display','none');
				jElem.addClass('deltatempremoved');
			}
        } else if(jElem.hasClass('deltatempremoved')) {
			jElem.css('display', this._elemCache[jElem.attr('id')] ); 
			jElem.removeClass('deltatempremoved');
			delete this._elemCache[jElem.attr('id')];
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
		if(! $(e).attr('className') ) {
			return false;
		}
		var that = this;
        var s = $(e).attr('className').split(' ').filter(function(el){
            return el.substr(0, that.dprefix.length+1) == that.dprefix+'_';
        })[0];
		var res = {};
		if(s) {
			var a = s.split(/_/);
			if(!a[1]) alert(s);
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
	
	// deprecated
	updateValues: function(name) {
		return this.updateTree(name);
	},
	
	updateTree: function (name) {
		var that = this;
		if (name == undefined) {
			$('body').find('.deltatempgenerated').each(function(){
				$(this).remove()
			});
			this.processTree($('body'));
		}
		else {
			var worker = function(i, v) {
				var inst = that._parseCommand(v);
				if(inst && inst.param == name) {
					$(v).find('.deltatempgenerated').remove();
					$(v).siblings('*[className*="'+that.dprefix+'+_$'+name+'"]').remove();
					that.processTree(v);
					that.processNode(v);
				} else {
					$(v).children().each(worker);
				}
			};
			worker(0, $('body'));
		}
	},
	
	updateValue: function(name) {
		var that = this;
		if( name == undefined) return;
		$('*').filter(function() {
			var inst = that._parseCommand(this);
			return (inst && inst.param == name);
		}).each(function(i, v) {
			that.processNode(v);
		});
	},
	
	
	getVariables: function() {
		return this._ns;
	},
	
    _dropCurtain: function(){
        if (!this._curtains) {
            return
        };
        $('body').hide();
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
            $('body').show();
        }
    },
	
	setPreProcess: function(f) {
		this.preproc = f;
	},
	setPostProcess: function(f) {
		this.postproc = f;
	}
}
