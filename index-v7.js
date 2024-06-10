
var rawletters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','R','S','T','W']
var letters = [
'E1','L1','S1','K1','B1','D1','W1','C1','T1','P1','J1','M1','I1','G1','N1','F1','O1','A1','H1','R1',
'E2','L2','S2','K2','B2' // extra letters for wrapping
]
var activeBonusLetters = []
var trailingExtras = 5
var timerTotal = 60
var timer = 0
var roundNumber = 1
var currentLetterIndex = [undefined,0,0]
var lastLetterIndex = [undefined,0,0]
var currentDistance = [undefined,0,0]
var currentBonus = [undefined,0,0]
var activeTeam
var categories = [
"School Supplies",
"Movie Titles",
"Mammals",
"Aquatic Animals",
"Vehicles",
"Plants",
"Countries",
"Drinks",
"Types of Exercise",
"Star Wars Characters",
"Things to pack on a trip",
"TV Characters",
"Cities",
"Things in a bedroom",
"Things in a kitchen",
"Things in a park",
"Languages",
"People in the Bible"
]
var containerAnim
var countdownInterval = undefined
function gameAttachDOM()
{
	// create letter carousel
	var container = document.getElementById("lettersContainer");
	for (var letter of letters)
	{
		var letterBox = document.createElement("div")
		letterBox.className = "letterBox"
		letterBox.setAttribute("id", "letter-" + letter);
		var letterBorder = document.createElement("div")
		letterBorder.className = "letterBorder"
		var letterText = document.createElement("div")
		letterText.className = "letter"
		letterText.innerHTML = letter[0]
		letterBorder.appendChild(letterText)
		letterBox.appendChild(letterBorder)
		container.appendChild(letterBox)

		letterBox.addEventListener('click', handleLetterClicked);
	}

	// bind function buttons
	var startButton = document.getElementById("startButton")
	startButton.addEventListener('click', startStopRound)

	var resetButton = document.getElementById("resetButton")
	resetButton.addEventListener('click', resetRound)

	var challengeButton = document.getElementById("challengeButton")
	challengeButton.addEventListener('click', undoLetter)

	var teamSelect1 = document.getElementById("teamSelect1")
	teamSelect1.addEventListener('click', handleTeam1Click)

	var teamSelect2 = document.getElementById("teamSelect2")
	teamSelect2.addEventListener('click', handleTeam2Click)

	var roundButtonPlus = document.getElementById("roundButtonPlus")
	roundButtonPlus.addEventListener('click', handleRoundPlus)

	disableCarousel()
	clearCategory()
	setActiveTeam(1)
}
function handleLetterClicked(event)
{
	console.log(`Clicked letter box '${event.currentTarget.id}.`)

	if (!event.currentTarget.classList.contains("letterBoxDisabled"))
	{
		var letterId = event.currentTarget.id.substring(event.currentTarget.id.length - 2)
		checkAwardBonus(letterId);

		var letterIndex = letters.indexOf(letterId)
		var newIndex = letterIndex + 1
		navigateLetter(newIndex)
	}
}
function isBonusLetter(letter)
{
	return activeBonusLetters.indexOf(letter.substring(0, 1)) >= 0
}
function checkAwardBonus(letter)
{
	if (isBonusLetter(letter))
	{
		recordBonusPoint()
	}
}
function recordBonusPoint()
{
	setBonusPoints(currentBonus[activeTeam] + 1, activeTeam)
}
function deductBonusPoint()
{
	setBonusPoints(currentBonus[activeTeam] - 1, activeTeam)
}
function setBonusPoints(points, team)
{
	currentBonus[activeTeam] = points > 1 ? points : 1

	// update display
	var element = document.getElementById(`teamBonus${activeTeam}`);
	element.innerHTML = currentBonus[activeTeam].toString()
}
function reinitializeCarousel()
{
	currentDistance[activeTeam] = 0
	updateTeamDistance(activeTeam)

	if (containerAnim){
		containerAnim.cancel()
		containerAnim = null
	}

	var container = document.getElementById("lettersContainer")
	containerAnim = container.animate([
		{ left: `-${100*currentLetterIndex[activeTeam]/3}%` }
	], { duration: 0, fill:"forwards" })
}
function navigateLetter(index)
{
	lastLetterIndex[activeTeam] = currentLetterIndex[activeTeam]

	currentDistance[activeTeam] += index - currentLetterIndex[activeTeam]
	updateTeamDistance(activeTeam)

	currentLetterIndex[activeTeam] = index
	var container = document.getElementById("lettersContainer")
	var currentStyle = getComputedStyle(container)
	var currentLeft = currentStyle.left

	// wrap
	var wrapStart = letters.length-trailingExtras
	if (lastLetterIndex[activeTeam] >= wrapStart)
	{
		lastLetterIndex[activeTeam] -= wrapStart
		currentLetterIndex[activeTeam] -= wrapStart
		currentLeft = `-${100*lastLetterIndex[activeTeam]/3}%`
	}

	containerAnim = container.animate([
		{ left: currentLeft },
		{ left: `-${100*currentLetterIndex[activeTeam]/3}%` }
	], { duration: 600, fill:"forwards" })
}
function undoLetter()
{
	var newIndex = lastLetterIndex[activeTeam]

	if (newIndex !== undefined)
	{
		// undo distance
		currentDistance[activeTeam] -= currentLetterIndex[activeTeam] - newIndex
		updateTeamDistance(activeTeam)

		// undo bonus points
		if (isBonusLetter(letters[newIndex]))
		{
			console.log("Challenge deducted one bonus point.")
			deductBonusPoint()
		}

		// move carousel
		var container = document.getElementById("lettersContainer")
		containerAnim = container.animate([
			{ left: `-${100*currentLetterIndex[activeTeam]/3}%` },
			{ left: `-${100*newIndex/3}%` }
		], { duration: 600, fill:"forwards" })

		currentLetterIndex[activeTeam] = newIndex
		lastLetterIndex[activeTeam] = undefined
	}
}
function resetRound()
{
	clearCategory()
	resetTimer()
	enableTeamSwitch()
	disableCarousel()
}
function resetTimer()
{
	clearInterval(countdownInterval)
	timer = 0
	refreshTimer()

	var startButton = document.getElementById("startButton")
	startButton.innerHTML = "Start"
}
function refreshTimer()
{
	const timerText = document.getElementById("timerText")
	var secondsStr = "0" + timer
	timerText.innerHTML = `0:${secondsStr.substring(secondsStr.length-2)}`
}
function disableCarousel()
{
	var lettersContainer = document.getElementById("lettersContainer")
	for (var child of lettersContainer.childNodes)
	{
		child.classList.remove("letterBox")
		child.classList.add("letterBoxDisabled")
	}
}
function enableCarousel()
{
	var lettersContainer = document.getElementById("lettersContainer")
	for (var child of lettersContainer.childNodes)
	{
		child.classList.add("letterBox")
		child.classList.remove("letterBoxDisabled")
	}
}
function isRoundActive()
{
	return !!timer
}
function startStopRound()
{
	if (timer > 0)
	{
		if (countdownInterval)
		{
			// pause
			//TODO: loses fractional seconds
			var startButton = document.getElementById("startButton")
			startButton.innerHTML = "Resume"
			clearInterval(countdownInterval)
			countdownInterval = undefined
			disableCarousel()
		}
		else
		{
			// resume
			setCountdownTimer()
			enableCarousel()
		}
	}
	else
	{
		// start new round
		generateCategory()
		enableCarousel()
		disableTeamSwitch()

		timer = timerTotal
		refreshTimer()
		setCountdownTimer();
	}
}
function handleTimerExpired()
{
	resetTimer()
	enableTeamSwitch()
	disableCarousel()
}
function enableTeamSwitch()
{
	var teamSelect1 = document.getElementById("teamSelect1")
	teamSelect1.classList.remove("buttonDisabled")
	teamSelect1.classList.add("button")
	var teamSelect2 = document.getElementById("teamSelect2")
	teamSelect2.classList.remove("buttonDisabled")
	teamSelect2.classList.add("button")
}
function disableTeamSwitch()
{
	var teamSelect1 = document.getElementById("teamSelect1")
	teamSelect1.classList.add("buttonDisabled")
	teamSelect1.classList.remove("button")
	var teamSelect2 = document.getElementById("teamSelect2")
	teamSelect2.classList.add("buttonDisabled")
	teamSelect2.classList.remove("button")
}
function setCountdownTimer()
{
	countdownInterval = setInterval(function(){
	timer--;
	refreshTimer()
	if (timer <= 0)
	{
		handleTimerExpired()
	}
	}, 1000);

	var startButton = document.getElementById("startButton")
	startButton.innerHTML = "Pause"
}
function generateCategory()
{
	var categoryText = document.getElementById("categoryText")
	var catIndex = Math.floor(Math.random() * categories.length)
	categoryText.innerHTML = categories[catIndex]
}
function clearCategory()
{
	var categoryText = document.getElementById("categoryText")
	categoryText.innerHTML = '<span class="noCategory">Category</span>'
}
function handleTeam1Click()
{
	if (!document.getElementById("teamSelect1").classList.contains("buttonDisabled"))
	setActiveTeam(1)
}
function handleTeam2Click()
{
	if (!document.getElementById("teamSelect2").classList.contains("buttonDisabled"))
	setActiveTeam(2)
}
function handleRoundPlus()
{
	roundNumber++
	document.getElementById("roundLabel").innerHTML = `Round ${roundNumber}`
	generateBonusLetter()

	// reset round bonuses
	setBonusPoints(1, 1)
	setBonusPoints(1, 2)
}
function generateBonusLetter()
{
	var letterPool = rawletters.filter(c => !activeBonusLetters.includes(c))
	if (letterPool.length > 0)
	{
		var randIndex = Math.floor(Math.random()*letterPool.length)
		addBonusLetter(letterPool[randIndex])
	}
}
function addBonusLetter(letter)
{
	activeBonusLetters.push(letter)

	// update letter elements
	for (var index = 1; index <= 2; ++index)
	{
		var element = document.getElementById(`letter-${letter}${index}`)
		if (element)
		{
			element.classList.add("bonusLetter")
		}
	}
}
function updateTeamDistance(index)
{
	const scoreBox = document.getElementById(`teamDistance${index}`)
	scoreBox.innerHTML = `${currentDistance[activeTeam]}`
}
function setActiveTeam(index)
{
	if (activeTeam == index)
	{
		return;
	}

	activeTeam = index

	var activeTeamBox = document.getElementById(`teamBox${activeTeam}`)
	activeTeamBox.classList.add("teamBoxActive")

	var inactiveTeam = 1 - (activeTeam-1) + 1;
	var inactiveTeamBox = document.getElementById(`teamBox${inactiveTeam}`)
	inactiveTeamBox.classList.remove("teamBoxActive")

	reinitializeCarousel()
	clearCategory()
}