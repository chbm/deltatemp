/**
 * @author chbm
 */
var contents = {
	now: function(elem){
        return Date().toString();
    },
	loggedin: false,
	notloggedin: true, //ok this sucks
	username: ''	
}
var dt;

function updateLogin() {
	contents.username = $('#usernamebox').val();
	contents.notloggedin = false;
	dt.updateValues('notloggedin');
	contents.loggedin = true;
//	dt.updateValues('username'); // shouldn't be needed!!
	dt.updateValues('loggedin');	
}

$(document).ready(function() {
    dt = new DeltaTemp(contents);
    dt.processDocument();		
		
	$.getJSON('posts.js', function(data) {
		contents.posts = data;
		dt.updateValues('posts');	
	} );
} );

