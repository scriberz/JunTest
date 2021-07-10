// gesture.js

static var avatar : GameObject;
static var avatarCam : GameObject;
static var gestureDrawing : GameObject;
static var GuiText : GameObject;
static var enterText : GUIText;

var p : Vector2;
var pointArr : Array;
static var mouseDown;

// runs when game starts - main function
function Start () {
	
	pointArr = new Array ();
	
	gestureDrawing = GameObject.Find("gesture");
	GuiText = GameObject.Find("GUIText");
	GuiText.guiText.text = GuiText.guiText.text + "\n Templates loaded: " + gestureTemplates.Templates.length;
	avatar = GameObject.FindWithTag("Player");
	
	flamePrefab = GameObject.Find("flame");
	
	// Find the main camera and disable the default mouselook script.
	avatarCam = GameObject.FindWithTag("MainCamera");
	avatarCam.GetComponent (MouseLook).enabled=false;
}


function worldToScreenCoordinates() {
	// fix world coordinate to the viewport coordinate
	var screenSpace = Camera.main.WorldToScreenPoint(gestureDrawing.transform.position);
	
	while (Input.GetMouseButton(1))
	{
		var curScreenSpace = Vector3(Input.mousePosition.x, Input.mousePosition.y, screenSpace.z);
		var curPosition = Camera.main.ScreenToWorldPoint(curScreenSpace); 
		gestureDrawing.transform.position = curPosition;
		yield;
	}
}

function Update()
{
	
	if (Input.GetMouseButtonDown(1)) {
		// run one time - click the right click button
		avatar.GetComponent (MouseLook).enabled=false;
		avatar.GetComponent (FPSWalker).enabled=false;
		mouseDown = 1;
	}
	
	if (mouseDown == 1) {
		p = Vector2(Input.mousePosition.x , Input.mousePosition.y);
		pointArr.Add(p);
		worldToScreenCoordinates();
	}


	if (Input.GetMouseButtonUp(1)) {
		if (Input.GetKey (KeyCode.LeftControl)) {
			// if CTRL is held down, the script will record a gesture. 
			mouseDown = 0;
			gestureRecognizer.recordTemplate(pointArr);
		
		} else {
			avatar.GetComponent (MouseLook).enabled=true;
			avatar.GetComponent (FPSWalker).enabled=true;
			mouseDown = 0;

			// start recognizing! 
			gestureRecognizer.startRecognizer(pointArr);

			pointArr.Clear();
		
		}
		
	}
	
} 

function OnGUI () {
	if(gestureRecognizer.recordDone == 1) { 
		windowRect = GUI.Window (0, Rect (350, 220, 300, 100), DoMyWindow, "Save the template?");
	}
}

function DoMyWindow (windowID : int) {
	
	gestureRecognizer.stringToEdit = GUILayout.TextField (gestureRecognizer.stringToEdit);

    if (GUI.Button (Rect (100,50,50,20), "Save")) {
		gestureTemplates.Templates.Push(gestureRecognizer.newTemplateArr);
		gestureTemplates.TemplateNames.Push(gestureRecognizer.stringToEdit);
		gestureRecognizer.recordDone = 0;
		gestureRecognizer.newTemplateArr.Clear();

		GuiText.guiText.text = "TEMPLATE: " + gestureRecognizer.stringToEdit +  "\n STATUS: SAVED";
	}

	if (GUI.Button (Rect (160,50,50,20), "Cancel")) {
       gestureRecognizer.recordDone = 0;
	   GuiText.guiText.text = "";
	}
}

