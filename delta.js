/*
 * 	Delta Template Framework
 *  Client Side JavaScript based HTML templating system
 *  
 *	Copyright (c) Carlos Morgado 2008
 *  Licensed under the GNU General Public License (GPL)
 */


/*
  INCLUDE jQuery

 Template Language
 <span deltemp="$foo">
 <div deltemp="include subtemplate.html">
 
*/


/*
	lifted from http://zealdev.wordpress.com/2008/04/15/jquery-template-engine/
	which in turn lifted it from mootools
	nothing is original anymore
*/
function $type(obj){
        if (obj == undefined) return false;
        if (obj.htmlElement) return 'element';
        var type = typeof obj;
        if (type == 'object' && obj.nodeName){
                switch(obj.nodeType){
                        case 1: return 'element';
                        case 3: return (/\S/).test(obj.nodeValue) ? 'textnode' : 'whitespace';
                }
        }
        if (type == 'object' || type == 'function'){
                switch(obj.constructor){
                        case Array: return 'array';
                        case RegExp: return 'regexp';
                }
                if (typeof obj.length == 'number'){
                        if (obj.item) return 'collection';
                        if (obj.callee) return 'arguments';
                }
        }
        return type;
};
/* end of lifted code */

DeltaTemp = function(ns) {
	this._ns = ns;
	this._procs = {};
	this.init();
};

DeltaTemp.prototype = DeltaTemp.fn = {
    init: function(){
        var cssObj = {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "yellow",
            'z-index': 99,
            'text-align': "center"
        }
/*        $('body').append('<div id="deltatempcurtain">loading ...</div>');
        $('#deltatempcurtain').css(cssObj).show();
        */
		$('body').hide();
    },
    
    processDocument: function(){
        this.processNode($('body'));
    },
    
    processNode: function(node, id){
        if (!id) {
            id = 0;
        };
        this._procs[id] = 1;
        nextid = id + 1;
        
        that = this;
        node.find('[deltemp]').each(function(i){
            if ($(this).attr('deltemp').substr(0, 1) == '$') {
                v = $(this).attr('deltemp').substr(1);
                switch ($type(that._ns[v])) {
                    case 'array':
                        for (n = that._ns[v].length - 1; n > -1; n--) {
                            $(this).clone().attr('id', $(this).attr('id') + 'd' + n).text(that._ns[v][n]).insertAfter($(this));
                        }
                        $(this).remove(); /* should I really remove the node ? */
                        break;
                    case 'function':
                        $(this).text(that._ns[v](this));
                        break;
                    case false:
                        /* doesn't exist */
                        break;
                    default:
                        $(this).text(that._ns[v]);
                }
            }
            else if ($(this).attr('deltemp').substr(0, 7) == 'include') {
                    /* include html */
                    var p = $(this).attr('deltemp').substr(8);
                    that._procs[nextid] = 1;
                    $(this).load(p, function(){
                        $(this).attr('deltemp', '+' + p);
                        that.processNode($(this), nextid);
                    });
            } 
			else if ($(this).attr('deltemp').substr(0, 4) == 'test') {
				/* conditional */
					var v = $(this).attr('deltemp').substr(5);
					var r = false;
					switch ($type(that._ns[v])) {
                    case 'array':
						/* grab the first value, whatever */
						r = that._ns[v][0];
                        break;
                    case 'function':
                        r = that._ns[v](this);
                        break;
                    case false:
                        /* doesn't exist */
                        break;
                    default:
                        r = that._ns[v];
                }
					if(! r) {
						$(this).remove();
					}
			}
        });
        delete (this._procs[id]);
        this._raiseCurtain();
    },
    
    _raiseCurtain: function(){
		var np=0;
		for(var i in this._procs) {np++};
        if (np == 0) {
/*            $('#deltatempcurtain').slideUp();*/
			$('body').fadeIn("slow");
        }
    }
}
