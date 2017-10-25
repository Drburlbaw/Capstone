
	var counter = 1;
	var limit = 3;
	function addInput(divName){
	if (counter == limit)  {
		alert("You have reached the limit of adding " + counter + " inputs");
	}
	else {
		var newdiv = document.createElement('div');
		newdiv.innerHTML = "<input type='text' name='myInputs[]' placeholder='New Entry'>";
		document.getElementById(divName).appendChild(newdiv);
		counter++;
		console.log(document.getElementByName(myInputs));
		}
		
	}

	function done(){
		var number = document.getElementById('docNum');
		var x = number.value;
		alert(x);


	}

		
