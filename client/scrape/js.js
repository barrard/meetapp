var socket = io.connect();
socket.on('connection', function (data) {
    console.log(data+ ' connection?????')
    localStorage.setItem("socketId", data)
})


var url = $('#url')
 iframe = $('#iframe').contents()

	jsonobj = {}
    if(localStorage.savedHTML){
	for (var k in JSON.parse(localStorage.savedHTML)){
		jsonobj[k]= JSON.parse(localStorage.savedHTML)[k]
		
		console.log('made a new jsonobj ' + jsonobj)
	}
}



url.on('keyup', function(e) {
    //console.log(e)
    if (e.keyCode === 13) {
$('#coverUp').css('width',window.innerWidth).css('height', window.innerHeight)
socket.emit('scrape', url.val())

        socket.on('serverResponse', function(data){
            console.log(data)
            //if (data ==='success') {saveHTML(url.val(), data)};
            document.location.reload()
        })
    };
})



$(window).on('click', function(e) {
    console.log(e.target)
})

function saveHTML(url, html){
	jsonobj[url] = html
	localStorage.savedHTML=JSON.stringify(jsonobj)
}


function checkLocalStoreage(){
	if(localStorage.savedHTML){console.log('localStorage has saved HTML');
		console.log(JSON.parse(localStorage.savedHTML))
		
		for(var k in JSON.parse(localStorage.savedHTML)){
			$('#websites').append('<li><h3>'+k+'</h3></li>')
			console.log(k);
			//console.log(JSON.parse(localStorage.savedHTML)[k])
			}
		}else{
			console.log('No saved HTML in LocalStorage avaiulable')

			var init = JSON.stringify(jsonobj)
			localStorage.savedHTML = init
		}
}

var domObj = {}
var clicksArry= []
$(iframe).on('click', function(e) {
    console.log('Clicked the IFRAME!!!')
    e.preventDefault()
    console.log('e.target ----------------------------------------------------')
      console.log( e.target)
    //for(var k in e.target){console.log(k+' : '+e.target[k])}
  
    domObj.targetDiv = e.target
    clicksArry.push(domObj.targetDiv)
    $('#clicks').append('<li>'+e.target.localName+' : '+e.target.innerHTML+'</li>')

    console.log('attributes '+e.target.attributes.length)
    console.log(e.target.attributes)
    domObj.divAttributes = e.target.attributes

    console.log('children '+e.target.children.length)
    console.log(e.target.children)
    domObj['children'] = e.target.children

    console.log('innerHTML')
    console.log(e.target.innerHTML)
    domObj['html'] = e.target.innerHTML

    console.log('parentEleement number of children')
    console.log(e.target.parentNode.children.length)
    console.log(e.target.parentNode.children)
    console.log('jQuery Object')
    console.log($(e.target))
});

function timer(){
	var x = 0;
	console.log(x)
	setInterval(function(){
		x++
		console.log(x)
	}, 1000)
}
(function(){
	//timer()
	
	checkLocalStoreage()
	console.log('onload?')

	//crazy code to just get the iframe title
	if($('#iframe').contents()[0].title){
	$('#websiteTitle').html($('#iframe').contents()[0].title)
	}else{setTimeout(function(){$('#websiteTitle').html($('#iframe').contents()[0].title)}, 50)}
	//crazy code alert!!///////////

	$('#websites').on('click', function(e){
		var address = e.target.innerHTML
		var e = jQuery.Event("keyup");
		e.which = 13; //choose the one you want
		e.keyCode = 13;
		$('#url').val(address)
		$("#url").trigger(e);
		//var myhtml = JSON.parse(localStorage.savedHTML)[address]
		//console.log(myhtml)
		//document.getElementById('iframe').src = "data:text/html;charset=utf-8," + myhtml;

	})



})()