/*
 --------------------------------------------
  (c) viezel studios - Gesture Recognizer     
 --------------------------------------------
*/

static var pointArray : Array;				// the current gesture saved in this array

// recognizer settings
static var maxPoints = 64;					// max number of point in the gesture
static var sizeOfScaleRect = 500;			// the size of the bounding box
static var compareDetail = 15;				// Number of matching iterations (CPU consuming) 
static var angleRange = 45;					// Angle detail level of when matching with templates 
static var recordDone = 0;
static var recognitionDone = 0;
static var gestureChosen = -1;
static var stringToEdit = "Enter a Template name";
static var newTemplateArr : Array;

static function startRecognizer (pointArray) {
	// main recognizer function
	pointArray = optimizeGesture(pointArray, maxPoints);
	var center = calcCenterOfGesture(pointArray);
	var radians = Mathf.Atan2(center.y - pointArray[0].y, center.x - pointArray[0].x);
	pointArray = RotateGesture(pointArray, -radians, center);
	pointArray = ScaleGesture(pointArray, sizeOfScaleRect);
	pointArray = TranslateGestureToOrigin(pointArray);
	gestureMatch(pointArray); 
	recognitionDone = 1;
}

static function recordTemplate (pointArray) {
	// record function
	
	pointArray = optimizeGesture(pointArray, maxPoints);
	var center = calcCenterOfGesture(pointArray);
	var radians = Mathf.Atan2(center.y - pointArray[0].y, center.x - pointArray[0].x);
	pointArray = RotateGesture(pointArray, -radians, center);
	pointArray = ScaleGesture(pointArray, sizeOfScaleRect);
	pointArray = TranslateGestureToOrigin(pointArray);
	
	newTemplateArr = new Array ();
	newTemplateArr = pointArray;

	recordDone = 1;

}



static function optimizeGesture(pointArray, maxPoints) {
	// take all the points in the gesture and finds the correct points compared with distance and the maximun value of points
	
	// calc the interval relative the length of the gesture drawn by the user
	var interval = calcTotalGestureLength(pointArray) / (maxPoints - 1);
	
	// use the same starting point in the new array from the old one. 
	var optimizedPoints = new Array(pointArray[0]);
	
	var tempDistance = 0.0;
	
	// run through the gesture array. Start at i = 1 because we compare point two with point one)
	for (var i : int = 1; i < pointArray.length; i++)	{
		var currentDistanceBetween2Points = calcDistance(pointArray[i - 1] , pointArray[i]);
		
		if ((tempDistance + currentDistanceBetween2Points) >= interval) {
			
			// the calc is: old pixel + the differens of old and new pixel multiply  
			var newX = pointArray[i - 1].x + ((interval - tempDistance) / currentDistanceBetween2Points) * (pointArray[i].x - pointArray[i - 1].x);
			var newY = pointArray[i - 1].y + ((interval - tempDistance) / currentDistanceBetween2Points) * (pointArray[i].y - pointArray[i - 1].y);
			
			// create new point
			var newPoint = new Vector2(newX, newY);
			
			// set new point into array
			optimizedPoints[optimizedPoints.length] = newPoint;

			pointArray.splice(i, 0, newPoint); 
			
			tempDistance = 0.0;
		} else {
			// the point was too close to the last point compared with the interval,. Therefore the distance will be stored for the next point to be compared.
			tempDistance += currentDistanceBetween2Points;
		}
	}
	
	// Rounding-errors might happens. Just to check if all the points are in the new array
	if (optimizedPoints.length == maxPoints - 1) {
		optimizedPoints[optimizedPoints.length] = new Vector2(pointArray[pointArray.length - 1].x, pointArray[pointArray.length - 1].y);
	}
	return optimizedPoints;
	
}



static function RotateGesture(pointArray, radians, center)  {
	// loop through original array, rotate each point and return the new array
	var newArray = new Array();
	var cos = Mathf.Cos(radians);
	var sin = Mathf.Sin(radians);
	
	for (var i = 0; i < pointArray.length; i++) {
		var newX = (pointArray[i].x - center.x) * cos - (pointArray[i].y - center.y) * sin + center.x;
		var newY = (pointArray[i].x - center.x) * sin + (pointArray[i].y - center.y) * cos + center.y;
		newArray[newArray.length] = new Vector2(newX, newY);
	}
	return newArray;
}

static function ScaleGesture(pointArray, size) {
	
	// equal min and max to the opposite infinity, such that every gesture size can fit the bounding box.
	var minX = Mathf.Infinity;
	var maxX = Mathf.NegativeInfinity; 
	var minY = Mathf.Infinity;
	var maxY = Mathf.NegativeInfinity;
	
	// loop through array. Find the minimum and maximun values of x and y to be able to create the box
	for (var i = 0; i < pointArray.length; i++) {
		if (pointArray[i].x < minX) {
			minX = pointArray[i].x;
		}
		if (pointArray[i].x > maxX) {
			maxX = pointArray[i].x;
		}
		if (pointArray[i].y < minY) {
			minY = pointArray[i].y;
		}
		if (pointArray[i].y > maxY) {
			maxY = pointArray[i].y;
		}
	}
	
	// create a rectangle surronding the gesture as a bounding box.
	var BoundingBox = Rect(minX, minY, maxX - minX, maxY - minY);
	
	
	var newArray = new Array();
	
	for (i = 0; i < pointArray.length; i++) {
		var newX = pointArray[i].x * (size / BoundingBox.width);
		var newY = pointArray[i].y * (size / BoundingBox.height);
		newArray[newArray.length] = new Vector2(newX, newY);
	}
	return newArray;
}


static function TranslateGestureToOrigin(pointArray) {
	var origin = Vector2(0,0);
	var center = calcCenterOfGesture(pointArray);
	var newArray = new Array();
	
	for (var i = 0; i < pointArray.length; i++){
		var newX = pointArray[i].x + origin.x - center.x;
		var newY = pointArray[i].y + origin.y - center.y;
		newArray[newArray.length] = new Vector2(newX, newY);
	}
	return newArray;
}


// --------------------------------  		     GESTURE OPTIMIZING DONE   		----------------------------------------------------------------
// -------------------------------- 		START OF THE MATCHING PROCESS	----------------------------------------------------------------

static function gestureMatch(pointArray) {
	var tempDistance = Mathf.Infinity;
	var count = 0;

	for (var i = 0; i < gestureTemplates.Templates.length; i++) {
		var distance = calcDistanceAtOptimalAngle(pointArray, gestureTemplates.Templates[i], -angleRange, angleRange);
		
		if (distance < tempDistance)	{
			tempDistance = distance;
			count = i;
		}
		
	}
	var HalfDiagonal = 0.5 * Mathf.Sqrt(Mathf.Pow(sizeOfScaleRect, 2) + Mathf.Pow(sizeOfScaleRect, 2));
	var score = 1.0 - (tempDistance / HalfDiagonal);
	
	// print the result
	
	if (score < 0.7) {
		print("NO MATCH " + score );
		gesture.GuiText.guiText.text = "RESULT: NO MATCH " +  "\n" + "SCORE: " + Mathf.Round(100 * score) +"%";
		gestureChosen = -1;
	} else {
		print("RESULT: " + gestureTemplates.TemplateNames[count] + " SCORE: " + score);
		gesture.GuiText.guiText.text = "RESULT: " + gestureTemplates.TemplateNames[count] + "\n" + "SCORE: " + Mathf.Round(100 * score) +"%";
		gestureChosen = count;
	}

}


// --------------------------------  		   GESTURE RECOGNIZER DONE   		----------------------------------------------------------------
// -------------------------------- 		START OF THE HELP FUNCTIONS		----------------------------------------------------------------


static function calcCenterOfGesture(pointArray) {
	// finds the center of the drawn gesture
	
	var averageX : float = 0.0;
	var averageY : float = 0.0;
	
	for (var i : int = 0; i < pointArray.length; i++) {
		averageX += pointArray[i].x;
		averageY += pointArray[i].y;
	}
	
	averageX = averageX / pointArray.length;
	averageY = averageY / pointArray.length;
	
	return new Vector2(averageX, averageY);
}	

static function calcDistance(point1, point2) {
	// distance between two vector points.
	var dx = point2.x - point1.x;
	var dy = point2.y - point1.y;
	
	return Mathf.Sqrt(dx * dx + dy * dy);
}

static function calcTotalGestureLength(pointArray) { 
	// total length of gesture path
	var length = 0.0;
	for (var i : int = 1; i < pointArray.length; i++) {
		length += calcDistance(pointArray[i - 1], pointArray[i]);
	}
	return length;
}


static function calcDistanceAtOptimalAngle(pointArray, T, negativeAngle, positiveAngle) {
	// Create two temporary distances. Compare while running through the angles. 
	// Each time a lower distace between points and template points are foound store it in one of the temporary variables. 
	
	radian1 = Mathf.PI * negativeAngle + (1.0 - Mathf.PI ) * positiveAngle;
	tempDistance1 = calcDistanceAtAngle(pointArray, T, radian1);
	
	radian2 = (1.0 - Mathf.PI ) * negativeAngle + Mathf.PI  * positiveAngle;
	tempDistance2 = calcDistanceAtAngle(pointArray, T, radian2);
	
	// the higher the number compareDetail is, the better recognition this system will perform. 
	for (i = 0; i < compareDetail; i++) {
		if (tempDistance1 < tempDistance2)	{
			positiveAngle = radian2;
			radian2 = radian1;
			tempDistance2 = tempDistance1;
			radian1 = Mathf.PI * negativeAngle + (1.0 - Mathf.PI) * positiveAngle;
			tempDistance1 = calcDistanceAtAngle(pointArray, T, radian1);
		} else {
			negativeAngle = radian1;
			radian1 = radian2;
			tempDistance1 = tempDistance2;
			radian2 = (1.0 - Mathf.PI) * negativeAngle + Mathf.PI * positiveAngle;
			tempDistance2 = calcDistanceAtAngle(pointArray, T, radian2);
		}
	}

	return Mathf.Min(tempDistance1, tempDistance2);
}

static function calcDistanceAtAngle(pointArray, T, radians) {
	// calc the distance of template and user gesture at 
	var center = calcCenterOfGesture(pointArray);
	var newpoints = RotateGesture(pointArray, radians, center);
	return calcGestureTemplateDistance(newpoints, T);
}	

static function calcGestureTemplateDistance(newRotatedPoints, templatePoints) {
	// calc the distance between gesture path from user and the template gesture
	var distance = 0.0;
	for (var i = 0; i < newRotatedPoints.length; i++) { // assumes newRotatedPoints.length == templatePoints.length
		distance += calcDistance(newRotatedPoints[i], templatePoints[i]);
	}
	return distance / newRotatedPoints.length;
}
