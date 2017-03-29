var 
socket = io('http://localhost:8080');
$(function(){
	$messageForm = $('#messageform'),
	$message = $('#message'),
	$chat = $('#chat'),
	$userForm = $('#userForm'),
	$userFormArea = $('#userFormArea'),
	$messageArea = $('#MessageArea'),
	$users = $('#users'),
	$nickname = $('#nickname'),
	$success = $('#success'),
	$error = $('#error'),
	$email = $('#email'),
	$password = $('#password'),
	$userexit = $('#userexit'),
	$guess = $('#guess'),
	$error = $('#error');
	$room = $('#room');

	$messageForm.submit(function(e){
		e.preventDefault();
		socket.emit('send message',$message.val());
		$message.val('');
	});

	socket.on('new message', function(data){
		$chat.append('<div class="well well-sm"><strong>'+ data.nickname + '</strong> : ' +  data.msg +'</div>');
	});

	socket.on('update_chat', function(sentence)
	{
		$chat.append('<div class="alert alert-success">'+  sentence + '</div>');
	});

	$userForm.submit(function(e){
		if($nickname.val){
			var nickname = $nickname.val();
			var room = $room.val();
			e.preventDefault();
			socket.emit('new user', nickname, room);
			$userFormArea.hide();
			$messageArea.show();
			$nickname.val('');
			$room.val('');
		}
	});

	socket.on('get users', function(data) {
		var html = '';
		for(i = 0; i < data.length; i++){
			html += '<li class="list-group-item">' + data[i] + '</li>';
		}
		$users.html(html);
	});

	function switchRoom(room){
		socket.emit('switchRoom', room);
	}
});