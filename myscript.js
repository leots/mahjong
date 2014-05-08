/* Shuffle array function */
function shuffle(array) {
	var currentIndex = array.length;
	var temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}

/* Hides a cell so it is not visible */
function hideCell(cellId) {
	cells[cellId].setAttribute("cell-status", "deactivated");
	
	if (cells[cellId].innerHTML == "-1")
		cells[cellId].style.display = "none";
	else
		cells[cellId].className = "cell-disappear-animation gameTable cellGradient";
}

/* Returns true is the cell is active, and false if it's not */
function cellIsActive(cellId) {
	if (cells[cellId].getAttribute("cell-status") == "deactivated")
		return false;
	else
		return true;
}

/* Returns true if there is no active cell on the left of the cell with cellId */
function isFreeLeft(cellId) {
	if (cellId % tableWidth == 0)			// if it's on the left side of the board it is free
		return true;
	else if (!cellIsActive(cellId - 1))		// if the cell on the left is inactive then it is free
		return true;
	else
		return false;
}

/* Returns true if there is no active cell on the right of the cell with cellId */
function isFreeRight(cellId) {
	if (cellId % tableWidth == tableWidth - 1)	// if it's on the right side of the board it is free
		return true;
	else if (!cellIsActive(cellId + 1))			// if the cell on the right is inactive then it is free
		return true;
	else
		return false;
}

/* Returns true if the cell can be removed (according to mahjong rules) */
function canBeRemoved(cellId) {
	if (isFreeLeft(cellId) || isFreeRight(cellId))
		return true;
	else
		return false;
}

/* Makes a cell selected */
function makeSelected(cellId) {
	cells[cellId].className = "gameTable selectedCellGradient";
	selectedCell = cellId;
}

/* Makes a cell the default color (unselected) */
function makeDeselected(cellId) {
	cells[cellId].className = "gameTable cellGradient";
}

/* Gets called when a cell is clicked */
function cellPressed(cellId) {
	//console.log("Cell with id " + cellId + " clicked (value: " + cells[cellId].innerHTML + " / position: " + (Math.floor(cellId / tableWidth)) + "," + (cellId % tableWidth) + ")");
	
	if (cellIsActive(cellId)) {
		if (cellId != selectedCell && selectedCell != -1) {
			if (canBeRemoved(cellId)) {			// Check if the selected cell can be removed, and highlight it or do nothing
				if (cells[selectedCell].innerHTML == cells[cellId].innerHTML) {		// user found a match, hide cells!
					hideCell(selectedCell);
					hideCell(cellId);
					selectedCell = -1;
					
					countMove("correct");
					
					if (boardEmpty()) {				// checking if user has won the game
						endGame(true);
						return;
					}
					
					if (isStuck())					// because cells changed, must check if game is stuck
						shuffleBoard();
				} else {							// user selected 2 cells with different values, so wrong move
					makeDeselected(selectedCell);	// change previously selected cell to default color
					makeSelected(cellId);			// select the clicked cell!
					countMove("wrong");
				}
			} else {								// user clicked a cell that cannot be removed, so wrong move
				makeDeselected(selectedCell);		// deselect the selected cell
				selectedCell = -1;
				countMove("wrong");
			}
		} else if (cellId == selectedCell) {		// user clicked on the same cell twice, unselecting it (does not count as wrong move)
			makeDeselected(cellId);
			selectedCell = -1;
		} else if (canBeRemoved(cellId)) {			// there is no selected cell, so selecting the clicked one
			makeSelected(cellId);
		}
	}
}

/* Returns true if the board is empty */
function boardEmpty() {
	var empty = true;
	for (var i = 0; i < tableHeight; i++) {
		if (rowHasActiveCell(i))
			empty = false;
	}
	return empty;
}

/* Adds rows and cells to the table */
function createTable(cellNumbers) {
	cells = new Array(tableHeight * tableWidth);
	var counter = 0;
	var row;
	for(var i = 0; i < tableHeight; i++) {
		row = table.insertRow(i);
		row.setAttribute("class", "gameTable");
		for(var j = 0; j < tableWidth; j++) {
			addCell(row, cellNumbers[counter], counter);
			counter++;
		}
	}
}

/* Shuffles the board */
function shuffleBoard() {
	var i, j;
	var activeCellNumbers = new Array();
	
	// copy active cells to new array
	for (i = 0; i < cells.length; i++) {
		if (cellIsActive(i)) {
			activeCellNumbers.push(cells[i].innerHTML);
		}
	}
	
	// shuffle new array
	activeCellNumbers = shuffle(activeCellNumbers);
	
	var numOfCellsToAnimate = activeCellNumbers.length;
	
	// add -1 to empty spaces of new array
	for (i = activeCellNumbers.length; i < cells.length; i++)
		activeCellNumbers.push(-1);
	
	// delete rows from current table (to add new ones)
	while(table.rows.length > 0)
		table.deleteRow(0);
	
	// add new table with new cells
	createTable(activeCellNumbers);
	
	selectedCell = -1;	// resetting this, no cells are selected after shuffling le board
	
	if (isStuck())
		shuffleBoard()
	
	animateTable(numOfCellsToAnimate - 1);
}

/* Returns the id of the LEFT_MOST ACTIVE CELL OF THE ROW WITH ID rowId */
function getLeft(rowId) {
	var row = table.rows[rowId].cells;
	
	for(var i = 0; i < row.length; i++) {
		if (cellIsActive(row[i].id))
			return row[i].id;
	}
}

/* Returns the id of the RIGHT_MOST ACTIVE CELL OF THE ROW WITH ID rowId */
function getRight(rowId) {
	var row = table.rows[rowId].cells;
	
	for(var i = row.length; i > 0; i--) {
		if (cellIsActive(row[i - 1].id))
			return row[i - 1].id;
	}
}

/* Checks if the row with id rowId has any active cells (returns true if it has at least one, false otherwise) */
function rowHasActiveCell(rowId) {
	var row = table.rows[rowId].cells;
	
	for (var i = 0; i < row.length; i++) {
		if (cellIsActive(row[i].id))
			return true;
	}
	return false;
}

/* Counts (and returns) how many tiles are available (= can be moved) with the specified number in them */
function countAvailable(number) {
	var counter = 0;
	var numOfRows = table.rows.length;
	
	for (var i = 0; i < numOfRows; i++) {
		if (rowHasActiveCell(i)) {
			leftCellId = getLeft(i);
			rightCellId = getRight(i);
			if (cells[leftCellId].innerHTML == number)
				counter++;
			if (cells[rightCellId].innerHTML == number && rightCellId != leftCellId)
				counter++;
		}
	}
	
	return counter;
}

/* Returns a random color (string) */
function getRandomColor() {
	var letters = '0123456789ABCDEF'.split('');
	var color = '#';
	for (var i = 0; i < 6; i++)
		color += letters[Math.round(Math.random() * 15)];
	return color;
}

/* Returns true if there are no moves available (if it's true, the board should be shuffled) */
function isStuck() {
	var numOfRows = table.rows.length;
	
	for (var i = 0; i < numOfRows; i++) {
		if (rowHasActiveCell(i)) {
			if (countAvailable(cells[getLeft(i)].innerHTML) > 1) {
				//console.log("More than one cells with " + cells[getLeft(i)].innerHTML + " can be removed");	<- uncomment the 2 lines in this function for hints
				return false;
			} else if (countAvailable(cells[getRight(i)].innerHTML) > 1) {
				//console.log("More than one cells with " + cells[getRight(i)].innerHTML + " can be removed");
				return false;
			}
		}
	}
	
	return true;
}

/* Changes the appearance of a cell on mouse over */
function mouseOver(cellId) {
	if (cellId != selectedCell && cellIsActive(cellId) && canBeRemoved(cellId)) {
		cells[cellId].className = "gameTable mouseOverCellGradient";
	}
}

/* Changes the appearance of a cell on mouse out */
function mouseOut(cellId) {
	if (cellId != selectedCell && cellIsActive(cellId) && canBeRemoved(cellId)) {
		cells[cellId].className = "gameTable cellGradient";
	}
}

function gimmeTitle() {
	document.getElementById("title").innerHTML = "&#3900;&#32;&#12388;&#32;&#9685;&#95;&#9685;&#32;&#3901;&#12388; Mahjong";
	
	setTimeout(function() { document.getElementById("title").innerHTML = "Mahjong" }, 500);
}

/* Adds a cell at the end of a row */
function addCell(row, innerHTML, counter) {
	col = row.insertCell(row.childElementCount);
	col.innerHTML = innerHTML;
	cells[counter] = col;
	col.id = counter;
	col.style.opacity = 0;
	col.style.border = "2px solid " + colors[innerHTML];
	col.setAttribute("class", "gameTable");
	col.setAttribute("onclick", "cellPressed(" + counter + ");");
	col.setAttribute("onmouseover", "mouseOver(" + counter + ");");
	col.setAttribute("onmouseout", "mouseOut(" + counter + ");");
	col.setAttribute("cell-status", "active");		// for checking if cell is active
	if (innerHTML == -1)							// for hiding cells when shuffling board
		hideCell(counter);
}

/* Makes array of colors to use for each number */
function makeGlobalColorsArray(limit) {
	colors = new Array();
	
	for (var i = 0; i < limit; i++)
		colors.push(getRandomColor());
}

/* Makes a randomized array for the game with the defined dimensions and difficulty */
function makeMahjongArray(leWidth, leHeight, difficulty) {
	var numbers = new Array(leWidth * leHeight);
	var limit = numbers.length / Math.pow(2, difficulty);	// 8, 4 or 2
	
	var iLoops = Math.pow(2, difficulty);
	for(var i = 0; i < iLoops; i++) {
		for(var j = 0; j < limit; j++)
			numbers[(i * limit) + j] = j;
	}
	
	numbers = shuffle(numbers);
	
	return numbers;
}

/* Does what the name says it does */
function createNewGameButton() {
	var button = document.createElement("input");
	button.type = "button";
	button.value="New game";
	button.onclick = function() {
		window.location = "index.html";
	};
	document.getElementById("nGButton").appendChild(button);
}

/* Adds the timer that counts the time, on the bottom bar :D */
function addTimerToBottomBar() {
	document.getElementById("timeCounter").innerHTML = count + " seconds";
}

/* Function to update move counters */
function updateMoveCounters() {
	document.getElementById("correctMovesCounter").innerHTML = "Valid moves: <span style='color:green'>" + correctMoves + "</span> | ";
	document.getElementById("wrongMovesCounter").innerHTML = "Invalid moves: <span style='color:red'>" + wrongMoves + "</span> | ";
}

/* Function to initialize move counters */
function initMoveCounters() {
	wrongMoves = 0;
	correctMoves = 0;
	updateMoveCounters();
}

/* Counts a correct or wrong move */
function countMove(wat) {
	if (wat == "correct")
		correctMoves++;
	else if (wat == "wrong")
		wrongMoves++;
	updateMoveCounters();
}

/* Calls the functions that add things to the bottom bar (below the mahjong board) */
function addThingsToBottomBar() {
	createNewGameButton();
	initTimer();
	initMoveCounters();
	document.getElementById("bottomBar").className = "bottomBar-animation";
}

/* Removes stuff from page and tells user if they won (win is a BOOLEAN) */
function endGame(win) {
	document.getElementById("theTable").parentNode.removeChild(document.getElementById("theTable"));
	document.getElementById("bottomBar").parentNode.removeChild(document.getElementById("bottomBar"));
	
	var totalMoves = correctMoves + wrongMoves;
	
	if (totalMoves != 0) {		// to prevent division by 0
		var correctPercentage = correctMoves / totalMoves * 100;
		correctPercentage = +correctPercentage.toFixed(2);		// Rounding to 2 decimal places
		var wrongPercentage = 100 - correctPercentage;
		wrongPercentage = +wrongPercentage.toFixed(2);
	} else {
		var correctPercentage = 0;
		var wrongPercentage = 0;
	}
	
	alert((win?"You win :D\n":"You lose! :(\n\n(╯°□°）╯︵ ƃuoɾɥɐW") + "\nTotal time: " + (totalTime - count) + " seconds\nValid moves: " + correctPercentage + "%\nInvalid moves: " + wrongPercentage + "%");
	window.location = "index.html";
}

/* Function that counts down */
function timer() {
	count--;
	
	// if user lost the game
	if (count <= 0) {
		clearInterval(counter);
		endGame(false);
		return;
	}
	
	// if user didn't lose the game
	document.getElementById("timeCounter").innerHTML = count + ((count == 1)?" second":" seconds");
	if (count == 10)
		document.getElementsByTagName("body")[0].className = "timeIsUp-animation";
}

/* Starts counting down until game over */
function initTimer() {
	totalTime = 300;	// 300 seconds = 5 minutes
	count = totalTime;
	counter = setInterval(timer, 1000);
	
	addTimerToBottomBar();
}

/* Animates the table */
function animateTable(i) {
	cells[i].style.opacity = 1;
	cells[i].className = "cell-move-in-animation gameTable cellGradient";
	if (i > 0) {
		setTimeout(animateTable, 10, i - 1);
	}
}

function startGame() {
	// getting variables from html page
	var size = document.getElementById("sizeSlider").value;
	var difficulty = 4 - document.getElementById("difficultySlider").value;	// "4 -" so 3 is hardest, 1 is easiest (the opposite of the slider's value..)
	
	// removing settings
	var div = document.getElementById("startscreenDiv");
	div.parentNode.removeChild(div);
	
	// creating the table
	table = document.createElement("table");	// global variable
	table.setAttribute("class", "gameTable");
	table.id = "theTable";
	
	tableHeight = 2*size;
	tableWidth = 4*size;
	
	var numbers = makeMahjongArray(tableWidth, tableHeight, difficulty);
	makeGlobalColorsArray(numbers.length / Math.pow(2, difficulty));
	
	createTable(numbers);		// the function also creates the global array cells
	
	selectedCell = -1; 			// global variable with selected cell
	
	// Shuffle the board if there are no moves to make
	if (isStuck())
		shuffleBoard();
	
	// adding the table to the page
	document.getElementById("divTable").appendChild(table);
	
	animateTable(cells.length - 1);
	
	// Adding new game button and other things to the bottom bar
	addThingsToBottomBar();
}
