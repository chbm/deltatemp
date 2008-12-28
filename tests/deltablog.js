/**
 * @author chbm
 */
var contents = {
	now: function(elem){
        return Date().toString();
    },
	loggedin: false,
	notloggedin: true, //ok this sucks
	username: '',
	morepostsnotloaded: true	
}
var dt;

function updateLogin() {
	contents.username = 'logging in ' + $('#usernamebox').val() + ' ...';
	contents.notloggedin = false;
	dt.updateValues('notloggedin');
	contents.loggedin = true;
	dt.updateValues('loggedin');	
	setTimeout(function() {
		contents.username = 'hello, ' + $('#usernamebox').val();
		dt.updateValues('username');
	}, 3000);	
	return false;
}

function showMorePosts() {
	contents.morepostsnotloaded = false;
	dt.updateValues('morepostsnotloaded');
	
	$.getJSON('moreposts.js', function(data) {
		
		jQuery.each(data, function() {contents.posts.push(this)});
		dt.updateValues('posts');	
	} );
}

$(document).ready(function() {
    dt = new DeltaTemp(contents);
    dt.processDocument();		
		
	$.getJSON('posts.js', function(data) {
		contents.posts = data;
		dt.updateValues('posts');	
	} );
} );

