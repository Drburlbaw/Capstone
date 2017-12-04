
	function deleteRow(r){
		var i = r.parentNode.parentNode.rowIndex;
    	document.getElementById("table").deleteRow(i);

	}

	function addRow(){
		var table = document.getElementById("table");

		var row = table.insertRow();

		var cell1 = row.insertCell();
		var cell2 = row.insertCell();
		var cell3 = row.insertCell();

		cell1.innerHTML = "<input id=\"docNum\" style=\"width:200px;\" name=\"type\" type=\"text\" placeholder=\"type\" >";
		cell2.innerHTML = "<input id=\"docNum\" name=\"value\" type=\"text\" placeholder=\"value\">";
		cell3.innerHTML = "<input type=\"button\" style=\"width:auto;\" value=\"delete\" onclick=\"deleteRow(this);\">";
	}

	function done(){
		var number = document.getElementById('docNum');
		var x = number.value;
		alert(x);


	}

		
