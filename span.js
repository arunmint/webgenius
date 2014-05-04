var lastNode;

window.onload = function() {
	callAPI("annotation", {"url": document.baseURI}, "get");

	// Add the annotate button
	var page = document.body;
	var button = document.createElement("div");
	button.setAttribute("id", "span_annotate_button");
	button.innerText = "SPN";
	page.appendChild(button);

	// Add the annotating text box
	var annotation = document.createElement("div");
	annotation.setAttribute("id", "span_annotation");
	var input = document.createElement("input");
	input.setAttribute("type", "textarea");
	input.setAttribute("id", "span_annotation_input");
	input.setAttribute("cols", 25)	;
	input.setAttribute("rows", 5);
	var cancelButton = document.createElement("button");
	cancelButton.innerText = "Cancel";
	cancelButton.setAttribute("id", "span_annotation_cancel");
	var saveButton = document.createElement("button");
	saveButton.innerText = "Save";
	saveButton.setAttribute("id", "span_annotation_save");
	annotation.appendChild(input);
	annotation.appendChild(cancelButton);
	annotation.appendChild(saveButton);
	page.appendChild(annotation);

	// Add the note text box
	var note = document.createElement("div");
	note.setAttribute("id", "span_note");
	page.appendChild(note);

	// Listen for events
	document.onmouseup = showButton;
	document.onmousedown = clickAway;
	window.onscroll = scrollAway;
}

var showButton = function(event) {
    var text = "";
    text = getSelectionHtml();
    console.log(text);
    if (text.length > 0) {
    	var button = document.getElementById("span_annotate_button");
		lastNode = getSelectionObject();
		button.setAttribute("value", text);
		button.style.left = event.x + "px"
		button.style.top = event.y + "px";
		button.style.visibility = "visible";
    }
}

var showTextBox = function() {
	var annotation = document.getElementById("span_annotation");
	var button = document.getElementById("span_annotate_button");
	annotation.style.left = button.style.left;
	annotation.style.top = button.style.top;
	annotation.style.visibility = "visible";

	var wrapper = document.createElement("span");
	wrapper.className = "span_annotated_selection";
	var range = lastNode.getRangeAt(0).cloneRange();
    range.surroundContents(wrapper);
    console.log(wrapper);
}

var hideTextBox = function() {
	var annotation = document.getElementById("span_annotation");
	annotation.style.visibility = "hidden";
}

var showNote = function(event) {
	console.log(event);
	var note = document.getElementById("span_note");
	note.innerText = event.toElement.getAttribute("data-annotation");
	note.style.left = event.x + "px";
	note.style.top = event.y + "px";
	note.style.visibility = "visible";
}

var hideNote = function() {
	var note = document.getElementById("span_note");
	note.style.visibility = "hidden";
}

var clickAway = function(e) {
	// Hide annotate button; show/hide input box
	console.log(e);
	var button = document.getElementById("span_annotate_button");
	button.style.visibility = "hidden";
	var pressed = e.toElement;
	if (pressed !== undefined) {
		var pressedId = pressed.getAttribute("id");
		var pressedClass = pressed.className;
		if (pressedId === "span_annotate_button" ) {
			// Show input box
			showTextBox();
		} else if (pressedId !== "span_annotation" && pressed.parentNode.getAttribute("id") !== "span_annotation") {
			// Hide input box
			hideTextBox();
		} else {
			// Process input selection
			if (pressedId === "span_annotation_cancel") {
				hideTextBox();
			} else if (pressedId === "span_annotation_save") {
				createAnnotation();
				hideTextBox();
			}
		}

		if (pressedClass === "span_annotated_selection") {
			// Show note
			showNote(e);
		} else if (pressedClass !== "span_note") {
			// Hide note
			hideNote();
		}
	}
}

function getSelectionHtml() {
    var html = "";
    if (typeof window.getSelection != "undefined") {
        var sel = window.getSelection();
        if (sel.rangeCount) {
            var container = document.createElement("div");
            for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                container.appendChild(sel.getRangeAt(i).cloneContents());
            }
            html = container.innerHTML;
        }
    } else if (typeof document.selection != "undefined") {
        if (document.selection.type == "Text") {
            html = document.selection.createRange().htmlText;
        }
    }
    return html;
}

var scrollAway = function() {
	// Hide annotate button and input box
	var button = document.getElementById("span_annotate_button");
	button.style.visibility = "hidden";
	var note = document.getElementById("span_note");
	note.style.visibility = "hidden";
}

var getSelectionObject = function() {
    var sel = document.selection, range;
    if (!sel && window.getSelection) {
        sel = window.getSelection();
    }
    return sel;
}

var createAnnotation = function() {
	var button = document.getElementById("span_annotate_button");
	var text = button.getAttribute("value");
	var url = document.baseURI;
	var annotation = document.getElementById("span_annotation_input").value;
	if (annotation.length > 0 && text.length < 300 && url.length > 0) {
		callAPI("annotation", {"text": text, "url": url, "annotation": annotation}, "post");
	}
}

var addAnnotation = function(annotation) {
	document.body.innerHTML = document.body.innerHTML.replace(annotation.text, "<span class='span_annotated_selection' data-annotation='" + annotation.annotation + "'>" + annotation.text + "</span>");
}

///////// REST API calls /////////////

var callAPI = function(model, qualifiers, action) {
	var keys = Object.keys(qualifiers);
	var xhr = new XMLHttpRequest();
	var qualString = "";
	keys.forEach(function(key){
	    qualString += key;
	    qualString += "=";
	    qualString += qualifiers[key];
	    qualString += "&";
	});
	if (action === "get") {
		console.log("http://spanapi.herokuapp.com/" + model + "?" + qualString);
		xhr.open("GET", "http://spanapi.herokuapp.com/" + model + "?" + qualString, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
			    // JSON.parse does not evaluate the attacker's scripts.
			    var resp = JSON.parse(xhr.responseText);
			    for (i = 0; i < resp.length; ++i) {
			    	console.log(resp[i]);
			    	addAnnotation(resp[i]);
				}
			}
		}
		xhr.send();
	} else if (action === "post") {
		xhr.open("POST", "http://spanapi.herokuapp.com/" + model, true);
		xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		xhr.onreadystatechange = function() {};
		xhr.send(qualString);
	}
}
