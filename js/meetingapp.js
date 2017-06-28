//
// File .....: meetinapp.js
//
// Author ...: Wouter Dupré
// Created ..: 2016-07-01
// Modified .: 2017-06-27
//

// importagenda.js

function buttonClick(buttonValue) {
	var rowid;
	var i = 0;
	var buttonValuePart = buttonValue.split("-");

	// if (buttonValue.startsWith("page-timer-report-")) {
	// startsWith fails on Android, so replaced with the split and array code
	if (buttonValuePart.length == 5 && buttonValuePart[0] == "page"
			&& buttonValuePart[1] == "timer" && buttonValuePart[2] == "report"
			&& buttonValuePart[3] == "deleteRow") {
		rowid = buttonValuePart[4];
		deleteTimerReportRow(rowid);

	} else {
		// if (buttonValue.startsWith("page-timer-")) {
		// startsWith fails on Android, so replaced with the split and array
		// code
		if (buttonValuePart.length == 3 && buttonValuePart[0] == "page"
				&& buttonValuePart[1] == "timer") {
			rowid = buttonValuePart[2];
			localStorage.setItem("currentTMAgendaRow", Number(rowid));
			$(':mobile-pagecontainer').pagecontainer("change", "#page-timer", {
				transition : "slide"
			});
		} else {
			switch (buttonValue) {
			case "toastmastersAgendaSave":
				importAgenda();
				break;
			case "refreshagenda":
				refreshAgenda();
				break;
			case "toastmastersTimerSave":
				saveTimerData();
				break;
			default:
				alert("main.js: unhandled buttonValue '" + buttonValue + "'");
			}
		}
	}
}

$(document).on(
		'pagebeforeshow',
		'#page-import-agenda',
		function(event) {
			var easySpeakServer = null;

			var objSettings = JSON.parse(localStorage.getItem("TMSettings"));
			if (objSettings != null) {
				easySpeakServer = objSettings.easySpeakServer;
			}
			if (easySpeakServer == null) {
				easySpeakServer = "tmclub.eu";
			}
			if (easySpeakServer == "no-easy-Speak") {
				$("#page-import-agenda #gotoEasyspeakAgendaDetail").addClass(
						"ui-state-disabled");

			} else {
				$("#page-import-agenda #gotoEasyspeakAgendaDetail")
						.removeClass("ui-state-disabled");
			}

			$('#agendaContent').val("");
		});

// $("#importButtonSave").on("touchend", function () { alert("message"); });

function gotoEasyspeakAgendaDetail() {
	/* Determine Servername */
	var easySpeakServer = null;
	var objSettings = JSON.parse(localStorage.getItem("TMSettings"));

	if (objSettings != null) {
		easySpeakServer = objSettings.easySpeakServer;
	}
	if (easySpeakServer == null) {
		easySpeakServer = "tmclub.eu";
	}

	if (easySpeakServer != "no-easy-Speak") {
		/* Open page */
		if (isRunningAsApp()) {
			cordova.InAppBrowser
					.open('https://' + easySpeakServer
							+ '/view_meeting.php?t=next&pr=2', '_blank',
							'location=yes');
		} else {
			window.open('https://' + easySpeakServer
					+ '/view_meeting.php?t=next&pr=2', '_system',
					'location=yes');
		}
	}
}

function importAgenda() {
	var agendaDetails = $('#agendaContent').val();
	if (agendaDetails == null || agendaDetails == "") {
		setTimeout(function() {
			$('#popup-import-without-data').popup();
			$('#popup-import-without-data').popup('open');
		}, 250);
		$("#popup-import-without-data #popupImportWithoutDataButtonContinue")
				.on(
						"click",
						function() {
							parseTextToAgenda();
							setTimeout(function() {
								$('#NumAgendaLinesImported').html(
										"Agenda is now empty.");
								$('#popup-import-agenda-complete').popup();
								$('#popup-import-agenda-complete')
										.popup('open');
							}, 250);
							setTimeout(function() {
								$('#popup-import-agenda-complete').popup(
										"close");
							}, 2000);
							/*
							 * There seems to be an issue with the code below
							 * that causes the navigation to go back an extra
							 * page each time you use it. That's why the code is
							 * commented out. setTimeout(function(){
							 * $.mobile.back(); }, 2250);
							 */
						});
		$("#popup-import-without-data #popupImportWithoutDataButtonContinue")
				.on(
						"popupafterclose",
						function() {
							$(
									"#popup-import-without-data #popupImportWithoutDataButtonContinue")
									.unbind("click");
						});
	} else {
		parseTextToAgenda();
		setTimeout(
				function() {
					var arrTMAgenda = JSON.parse(localStorage
							.getItem("TMAgenda"));
					$('#NumAgendaLinesImported')
							.html(
									JSON
											.parse(localStorage
													.getItem("TMAgenda")).TMAgenda.length
											+ " item(s) have been saved.");
					$('#popup-import-agenda-complete').popup();
					$('#popup-import-agenda-complete').popup('open');
				}, 100);
		setTimeout(function() {
			$('#popup-import-agenda-complete').popup("close");
		}, 2000);
		/*
		 * There seems to be an issue with the code below that causes the
		 * navigation to go back an extra page each time you use it. That's why
		 * the code is commented out. setTimeout(function(){ $.mobile.back(); },
		 * 2250);
		 */
	}

}

function parseTextToAgenda() {
	var agendaDetails = $('#agendaContent').val();
	var agendaTime = "";
	var agendaRole = "";
	var agendaPresenter = "";
	var agendaEvent = "";
	var agendaDurationGreen = "";
	var agendaDurationAmber = "";
	var agendaDurationRed = "";
	var agendaSection = false;
	var agendaItem = false;
	var arrTMAgenda = {
		"TMAgenda" : []
	};
	var objAgendaItem = {};
	var agendaRecord = {};

	var arrAgendaDetailLine = agendaDetails.split(/\r\n|\r|\n/g); // breaks
																	// the file
																	// in array
																	// of lines
	for (var i = 0; i < arrAgendaDetailLine.length; i++) {
		var arrAgendaFields = arrAgendaDetailLine[i].split(/\t/g);
		for (var j = 0; j < arrAgendaFields.length; j++) {
			arrAgendaFields[j] = arrAgendaFields[j].trim();
		}

		switch (arrAgendaFields.length) {
		case 1:
			if (arrAgendaFields[0] == "Attendance") {
				agendaSection = false;
			}
		case 2:
			break;
		case 3:
			// line with duration
			if (agendaItem == true) {
				agendaItem = false;
				agendaDurationGreen = arrAgendaFields[0];
				agendaDurationAmber = arrAgendaFields[1];
				agendaDurationRed = arrAgendaFields[2];
				// Write AgendaItem
				// console.log(agendaTime + "|" + agendaRole + "|" +
				// agendaPresenter + "|" + agendaEvent + "|" +
				// agendaDurationGreen + "|" + agendaDurationAmber + "|" +
				// agendaDurationRed);

				objAgendaItem = {};
				objAgendaItem["MeetingDate"] = null;
				objAgendaItem["MeetingDateTime"] = null;
				objAgendaItem["ActualDateTime"] = null;
				objAgendaItem["mTime"] = agendaTime;
				objAgendaItem["Role"] = agendaRole;
				objAgendaItem["Presenter"] = agendaPresenter;
				objAgendaItem["Event"] = agendaEvent;
				objAgendaItem["DurationGreen"] = agendaDurationGreen;
				objAgendaItem["DurationGreenSec"] = convertTimeStringToSeconds(agendaDurationGreen);
				objAgendaItem["DurationAmber"] = agendaDurationAmber;
				objAgendaItem["DurationAmberSec"] = convertTimeStringToSeconds(agendaDurationAmber);
				objAgendaItem["DurationRed"] = agendaDurationRed;
				objAgendaItem["DurationRedSec"] = convertTimeStringToSeconds(agendaDurationRed);
				arrTMAgenda.TMAgenda.push(objAgendaItem);
			}
			break;
		case 5:
			// Line with either title or details
			if (agendaSection == true) {
				agendaTime = arrAgendaFields[0];
				agendaRole = arrAgendaFields[1];
				agendaPresenter = arrAgendaFields[2];
				agendaEvent = arrAgendaFields[3];
				agendaItem = true;
			} else if (arrAgendaFields[0] == "Time"
					&& arrAgendaFields[1] == "Role"
					&& arrAgendaFields[2] == "Presenter"
					&& arrAgendaFields[3] == "Event"
					&& arrAgendaFields[4] == "Duration") {
				agendaSection = true;
			}
			break;
		default:
			console.log("Unhandled number of fields on line:"
					+ arrAgendaFields.length);
		}
	}

	if (arrTMAgenda.TMAgenda.length == 0) {
		// Try Mobile import

		var fieldNum = 0;
		var numFields = 0;
		var arrField = [ "mTime", "Role", "Presenter", "Manual", "Project",
				"Event", "Description", "DurationGreen", "DurationAmber",
				"DurationRed" ];

		agendaSection = false;
		for (var i = 0; i < arrAgendaDetailLine.length; i++) {
			// as long as we haven't reached that line, we can continue
			// searching for it
			if (agendaSection == false && arrAgendaDetailLine[i] != "Agenda") {
				continue;
			}
			// if the line only contains "Agenda", we've reached the Agenda
			// section and the real work begins
			if (arrAgendaDetailLine[i] == "Agenda") {
				agendaSection = true;
				agendaRecord = initializeAgendaRecord();
				continue;
			}
			// when we find line with "Attendance", then we've reached the end
			// of the agenda
			if (arrAgendaDetailLine[i] == "Attendance") {
				agendaSection = false;
				continue;
			}

			var arrFields = arrAgendaDetailLine[i].split(" ");

			numTimeValues = 0;
			if (arrFields.length == 1 || arrFields.length == 3) {
				// Check if Time line for Duration line
				for (var w = 0; w < arrFields.length; w++) {
					arrFields[w] = arrFields[w].trim();
					if (arrFields[w].length >= 4 && arrFields[w].length <= 5) {
						// if the length of the word equals 5 then try to split
						// it in MM and SS
						var arrPortion = arrFields[w].split(":");
						if (arrPortion.length == 2 && arrPortion[0].length >= 1
								&& arrPortion[0].length <= 2
								&& arrPortion[1].length == 2) {
							// More detailed checks could be done, like checking
							// for numeric values
							// but for now this will do
							numTimeValues++;
						}
					} else {
						break;
					}
				}
			}
			// if (numTimeValues > 0) {numFields++;}

			switch (numTimeValues) {
			case 1:
				// console.log("Time: " + arrFields[0]);
				if (numFields > 0) {
					// Write data first, then start new record
					addRecordToAgenda(arrTMAgenda, agendaRecord);
					agendaRecord = initializeAgendaRecord();
					numFields = 0;
				}
				agendaRecord["mTime"] = arrAgendaDetailLine[i];
				numFields++;
				break;
			case 3:
				// console.log("Green: " + arrFields[0] + ", Amber: " +
				// arrFields[1] + ", Red: " + arrFields[2]);
				agendaRecord["DurationGreen"] = arrFields[0];
				agendaRecord["DurationAmber"] = arrFields[1];
				agendaRecord["DurationRed"] = arrFields[2];
				addRecordToAgenda(arrTMAgenda, agendaRecord);
				agendaRecord = initializeAgendaRecord();
				numFields = 0;
				break;
			case 0:
				numFields++;
				switch (arrField[numFields - 1]) {
				case "Role":
				case "Presenter":
				case "Event":
					agendaRecord[arrField[numFields - 1]] = arrAgendaDetailLine[i];
					// console.log(arrField[numFields - 1] + ": " +
					// arrAgendaDetailLine[i]);
					break;
				}
			}

			fieldNum++;

		}
		if (numFields > 0) {
			addRecordToAgenda(arrTMAgenda, agendaRecord);
		}
	}

	localStorage.setItem("TMAgenda", JSON.stringify(arrTMAgenda));
	$('#agendaContent').val("");
	$('#agendaContent').textinput("refresh");
}

function convertTimeStringToSeconds(stringTime) {
	return null;
}

function initializeAgendaRecord() {
	newAgendaRecord = {
		"mTime" : null,
		"Role" : null,
		"Presenter" : null,
		"Event" : null,
		"DurationGreen" : null,
		"DurationAmber" : null,
		"DurationRed" : null
	};
	return newAgendaRecord;
}

function addRecordToAgenda(arrTMAgenda, agendaRecord) {

	if (agendaRecord["mTime"] == null) {
		agendaRecord["mTime"] = "";
	}
	if (agendaRecord["Role"] == null) {
		agendaRecord["Role"] = "";
	}
	if (agendaRecord["Presenter"] == null) {
		agendaRecord["Presenter"] = "";
	}
	if (agendaRecord["Event"] == null) {
		agendaRecord["Event"] = "";
	}
	if (agendaRecord["DurationGreen"] == null) {
		agendaRecord["DurationGreen"] = "";
	}
	if (agendaRecord["DurationAmber"] == null) {
		agendaRecord["DurationAmber"] = "";
	}
	if (agendaRecord["DurationRed"] == null) {
		agendaRecord["DurationRed"] = "";
	}
	arrTMAgenda.TMAgenda.push(agendaRecord);
	return arrTMAgenda;
}

// agenda.js
var agendaTimer;

$(document).on('pagebeforeshow', '#page-agenda', function(event) {
	refreshAgenda();
});

// Start timer
// <vartimer> = setInterval(<function>, <intervalms>);
// Stop timer
// clearInterval(<vartimer>);

$(document).on("pageshow", "#page-agenda", function(event) {
	var stayAwake = false;
	var rowHeight = 2;
	var buttonTimer = true;

	// console.log("Switch on agenda timer");
	agendaTimer = setInterval(checkMeetingTimer, 500);

	/* Apply Agenda Settings */
	objSettings = JSON.parse(localStorage.getItem("TMSettings"));
	if (objSettings != null) {
		stayAwake = objSettings.stayAwakeInAgenda;
		rowHeight = objSettings.rowHeightAgenda;
		buttonTimer = objSettings.timerButtonAgenda;
	}
	if (stayAwake == true) {
		if (isRunningAsApp()) {
			window.plugins.insomnia.keepAwake();
		}
	} else {
		if (isRunningAsApp()) {
			window.plugins.insomnia.allowSleepAgain();
		}
	}

	$('#page-agenda #AgendaTable tbody tr').css("height", rowHeight + "em");
	// console.log("RowHeight: " + rowHeight);
	// console.log("ButtonTimer: " + buttonTimer);

});

$(document).on("pagehide", "#page-agenda", function(event) {
	// console.log("switch off agenda timer");
	clearInterval(agendaTimer);
	if (isRunningAsApp()) {
		window.plugins.insomnia.allowSleepAgain();
	}
});

function checkMeetingTimer() {
	var currentTime = new Date();
	var currentHours = currentTime.getHours();
	var currentMinutes = currentTime.getMinutes();
	var topicHours;
	var topicMinutes;
	// console.log("Checking agenda...");
	$('.check-time').each(
			function() {
				topicHours = Number($(this).prop("innerText").split(":")[0]);
				topicMinutes = Number($(this).prop("innerText").split(":")[1]);
				pastTime = false;
				if (currentHours > topicHours) {
					pastTime = true;
				} else if (currentHours == topicHours
						&& currentMinutes >= topicMinutes) {
					pastTime = true;
				}
				if (pastTime) {
					$(this).removeClass("check-time").addClass("past-time");
				}
			});
	// console.log("Checking agenda complete.");

}

function refreshAgenda() {
	var agendaItemId;
	var agendaTime;
	var agendaRole;
	var agendaPresenter;
	var agendaEvent;
	var agendaDurationGreen;
	var agendaDurationAmber;
	var agendaDurationRed;
	var buttonTimer = true;

	$('#AgendaTable').empty();

	var arrAgenda = JSON.parse(localStorage.getItem("TMAgenda"));

	/*
	 * 
	 * <thead> <tr> <th>Time</th> <th>Timer</th> <th>Role</th>
	 * <th data-priority="2">Presenter</th> <th data-priority="1">Event</th>
	 * <th data-priority="6">Green</th> <th data-priority="6">Amber</th>
	 * <th data-priority="6">Red</th> </tr> </thead> <tbody> <!-- Table
	 * content is dynamically added here --> </tbody>
	 * 
	 */
	$('#AgendaTable')
			.html(
					'<thead><tr><th>Time</th><th>Timer</th><th>Role</th><th data-priority="2">Presenter</th><th data-priority="1">Event</th><th data-priority="6">Green</th><th data-priority="6">Amber</th><th data-priority="6">Red</th></tr></thead><tbody></tbody>');

	if (arrAgenda == null) {
		return;
	} else {
		// Get Agenda Settings
		objSettings = JSON.parse(localStorage.getItem("TMSettings"));
		if (objSettings != null) {
			buttonTimer = objSettings.timerButtonAgenda;
		}
		for (var i = 0; i < arrAgenda.TMAgenda.length; i++) {
			agendaItemId = "TMAId" + i;
			if (buttonTimer == true) {
				$('#AgendaTable tbody').append(
						'<tr id="' + agendaItemId + '"></tr>');
			} else {
				$('#AgendaTable tbody').append(
						'<tr id="' + agendaItemId
								+ '" onclick="buttonClick(&quot;page-timer-'
								+ i + '&quot;)"></tr>');
			}
			$('#' + agendaItemId).append(
					'<td data-theme="a"><div class="check-time">'
							+ arrAgenda.TMAgenda[i].mTime + '</div></td>');
			$('#' + agendaItemId)
					.append(
							'<td><a href="#" class="row-button ui-btn ui-mini ui-corner-all ui-btn-icon-notext ui-icon-clock ui-nodisc-icon" onclick="buttonClick(&quot;page-timer-'
									+ i + '&quot;)">Timer</a></td>');
			$('#' + agendaItemId).append(
					'<td>' + arrAgenda.TMAgenda[i].Role + '</td>');
			$('#' + agendaItemId).append(
					'<td>' + arrAgenda.TMAgenda[i].Presenter + '</td>');
			$('#' + agendaItemId).append(
					'<td>' + arrAgenda.TMAgenda[i].Event + '</td>');
			$('#' + agendaItemId).append(
					'<td>' + arrAgenda.TMAgenda[i].DurationGreen + '</td>');
			$('#' + agendaItemId).append(
					'<td>' + arrAgenda.TMAgenda[i].DurationAmber + '</td>');
			$('#' + agendaItemId).append(
					'<td>' + arrAgenda.TMAgenda[i].DurationRed + '</td>');
		}

		if (buttonTimer != true) {
			$('#AgendaTable tr').find('td:eq(1),th:eq(1)').remove();
		}

		$('#AgendaTable').table("refresh");

		/* Manual fix for columns button */
		var columnIndex = 0;
		$("#AgendaTable fieldset").find("input").each(
				function() {
					var sel = ":nth-child(" + (columnIndex + 1) + ")";
					$(this).jqmData("cells",
							$("#AgendaTable").find("tr").children(sel));
					columnIndex++;
				});
		/* End of Manual fix for columns button */

		checkMeetingTimer();
	}
}

// timer.js

var timerMilliseconds = 0;
var timerTotalMilliseconds = 0;
var timerGreen = 5;
var timerAmber = 8;
var timerRed = 10;
var timerInterval = 100;
var timerEnabled = false;
var timerReset = true;
var timerStartTime;
var timerOldTime;
var currentColor = "black";
var oldColor = "";

var myTimer;

$(document).on("pagecreate", '#page-timer', function(event) {
	setNewColor(currentColor);
});

$(document).on('pagebeforeshow', '#page-timer', function(event) {
	var objSettings;

	setTimerData();
	updateTimerSettingsTitle("Green");
	updateTimerSettingsTitle("Amber");
	updateTimerSettingsTitle("Red");
	// In case timer is enabled and settings have been changed, make the
	// necessary changes
	if (timerEnabled) {
		objSettings = JSON.parse(localStorage.getItem("TMSettings"));
		if (objSettings != null) {
			stayAwake = objSettings.stayAwakeWhileTiming;
		}
		if (stayAwake) {
			if (isRunningAsApp()) {
				window.plugins.insomnia.keepAwake();
			}
		} else {
			if (isRunningAsApp()) {
				window.plugins.insomnia.allowSleepAgain();
			}
		}
	}
});

function setTimerData() {
	var arrTime;
	// read rowid from localStorage if available
	var rowid = localStorage.getItem("currentTMAgendaRow");

	if (rowid != null) {
		rowid = Number(rowid);
		var arrAgenda = JSON.parse(localStorage.getItem("TMAgenda"));
		if (arrAgenda != null && arrAgenda.TMAgenda.length >= rowid) {
			var rowAgenda = arrAgenda.TMAgenda[rowid];
			$('#timerComment').val(
					rowAgenda.Role + " - " + rowAgenda.Presenter + " - "
							+ rowAgenda.Event);
			if (rowAgenda.DurationGreen != null
					&& rowAgenda.DurationGreen != "") {
				arrTime = rowAgenda.DurationGreen.split(":");
				$('#timerGreen').val(
						String(Number(arrTime[0]) * 60 + Number(arrTime[1])))
						.selectmenu("refresh");
			} else {
				$('#timerGreen').val("0").selectmenu("refresh");
			}
			if (rowAgenda.DurationAmber != null
					&& rowAgenda.DurationAmber != "") {
				arrTime = rowAgenda.DurationAmber.split(":");
				$('#timerAmber').val(
						String(Number(arrTime[0]) * 60 + Number(arrTime[1])))
						.selectmenu("refresh");
			} else {
				$('#timerAmber').val("0").selectmenu("refresh");
			}
			if (rowAgenda.DurationRed != null && rowAgenda.DurationRed != "") {
				arrTime = rowAgenda.DurationRed.split(":");
				$('#timerRed')
						.val(String(Number(arrTime[0]) * 60 + Number(arrTime[1])))
						.selectmenu("refresh");
			} else {
				$('#timerRed').val("0").selectmenu("refresh");
			}
		}
		resetTimer();

		localStorage.removeItem("currentTMAgendaRow");
	}

}

function updateTimer() {
	var d = new Date();
	timerMilliseconds = d - timerStartTime;
	newTimerValue(Math
			.round((timerTotalMilliseconds + timerMilliseconds) / 1000));
}

function startStopTimer() {
	var stayAwake = false;
	var objSettings;

	if (timerEnabled == true) {
		// Stop timer
		timerEnabled = false;
		clearInterval(myTimer);
		timerTotalMilliseconds = timerTotalMilliseconds + timerMilliseconds;
		// jQuery Mobile specific
		$('#timerStartStopButton').text('Start');
		// $('#timerResetButton').prop( "disabled", false );
		// $('#timerSaveButton').prop( "disabled", false );
		// $('#page-timer a[role="button"][data-rel="back"]').prop( "disabled",
		// false );
		$('#timerCardsButton').addClass("ui-state-disabled");
		$('#timerResetButton').removeClass("ui-state-disabled");
		$('#timerSaveButton').removeClass("ui-state-disabled");
		$('#page-timer a[role="button"][data-rel="back"]').removeClass(
				"ui-state-disabled"); // Back button
		$('#page-timer #btn-quick-timer').removeClass("ui-state-disabled"); // Quick
																			// Timer
																			// button

		objSettings = JSON.parse(localStorage.getItem("TMSettings"));
		if (objSettings != null) {
			stayAwake = objSettings.stayAwakeWhileTiming;
		}
		if (stayAwake) {
			if (isRunningAsApp()) {
				window.plugins.insomnia.allowSleepAgain();
			}
		}
	} else {
		// Start timer
		timerEnabled = true;
		if (timerReset == true) {
			timerReset = false;
			timerTotalMiliseconds = 0;
		}
		timerStartTime = new Date();
		myTimer = setInterval(updateTimer, timerInterval);
		// jQuery Mobile specific
		$('#timerStartStopButton').text('Stop');
		$('#timerCardsButton').removeClass("ui-state-disabled");
		$('#timerResetButton').addClass("ui-state-disabled");
		$('#timerSaveButton').addClass("ui-state-disabled");
		$('#page-timer a[role="button"][data-rel="back"]').addClass(
				"ui-state-disabled"); // Back button
		$('#page-timer #btn-quick-timer').addClass("ui-state-disabled"); // Quick
																			// Timer
																			// button
		// Collapse Timer Settings
		var $timerSettings = $('#timerSettings');
		$timerSettings.collapsible("option", "collapsed", true);
		// Disable Timer Settings
		$('#timerGreen').selectmenu('disable');
		$('#timerAmber').selectmenu('disable');
		$('#timerRed').selectmenu('disable');
		newTimerValue(Math.round(timerTotalMilliseconds / 1000));
		// Calculate color times
		var $greenS = $('#timerGreen');
		var $amberS = $('#timerAmber');
		var $redS = $('#timerRed');

		timerGreen = Number($greenS.val());
		timerAmber = Number($amberS.val());
		timerRed = Number($redS.val());
		objSettings = JSON.parse(localStorage.getItem("TMSettings"));
		if (objSettings != null) {
			stayAwake = objSettings.stayAwakeWhileTiming;
		}
		if (stayAwake) {
			if (isRunningAsApp()) {
				window.plugins.insomnia.keepAwake();
			}
		}
	}
}
function resetTimer() {
	timerReset = true;
	timerTotalMilliseconds = 0;
	newTimerValue(0);
	// Enable Timer Settings
	$('#timerGreen').selectmenu('enable');
	$('#timerAmber').selectmenu('enable');
	$('#timerRed').selectmenu('enable');
	$timerSettings = $('#timerSettings');
	$timerSettings.collapsible("option", "collapsed", false);
}
function showTimerCards() {
	$.mobile.changePage("#page-dynamic-card", {
		transition : "slide"
	});
}

function newTimerValue(numSeconds) {
	var hh = 0, mm = 0, ss = 0, tempValue = 0;

	ss = numSeconds % 60;
	tempValue = numSeconds - ss;
	tempValue = tempValue / 60;
	mm = tempValue % 60;
	tempValue = tempValue - mm;
	hh = tempValue / 60;

	if (hh < 10) {
		hh = "0" + hh;
	}
	if (mm < 10) {
		mm = "0" + mm;
	}
	if (ss < 10) {
		ss = "0" + ss;
	}

	// document.getElementById("timer").innerHTML = hh + ":" + mm + ":" + ss;
	$('#timer').html(hh + ":" + mm + ":" + ss);

	if (timerRed > 0 && numSeconds >= timerRed) {
		currentColor = "red";
	} else if (timerAmber > 0 && numSeconds >= timerAmber) {
		currentColor = "amber";
	} else if (timerGreen > 0 && numSeconds >= timerGreen) {
		currentColor = "green";
	} else if (timerEnabled == true) {
		currentColor = "grey";
	} else {
		currentColor = "";
	}
	if (oldColor != currentColor) {
		oldColor = currentColor;
		setNewColor(currentColor);

	}
}

function setNewColor(newColor) {
	var fileColor = "";
	var fileFolder = "images/"
	var prefix = "trafficlight_";
	var imageSize = "128"
	var suffix = ".png";
	var srcFull = "";
	var cssColor = "";
	var cssCardColor = "";
	var vibrateOn = false;

	switch (newColor) {
	case "":
	case "black":
		fileColor = "opaque";
		cssColor = "";
		cssCardColor = "black";
		break;
	case "grey":
		fileColor = "off";
		cssColor = "lightgrey";
		cssCardColor = "grey";
		break;
	case "green":
		fileColor = "green";
		cssColor = "lightgreen";
		cssCardColor = "#00FF00";
		break;
	case "amber":
		fileColor = "yellow";
		cssColor = "orange";
		cssCardColor = "yellow";
		break;
	case "red":
		fileColor = "red";
		cssColor = "red";
		cssCardColor = "red";
		break;
	}
	if (fileColor != "") {
		srcFull = fileFolder + prefix + fileColor + "_" + imageSize + "x"
				+ imageSize + suffix;
	} else {
		srcFull = fileFolder + "blank_" + imageSize + "x" + imageSize + suffix;
	}

	$('#timer').css('color', cssColor);
	switch (newColor) {
	case "green":
	case "amber":
	case "red":
		var objSettings = JSON.parse(localStorage.getItem("TMSettings"));
		if (objSettings != null) {
			vibrateOn = objSettings.vibrateOnLimit;
		}
		if (vibrateOn) {
			navigator.vibrate(500);
		}
	}
	$('#imageTimer').attr('src', srcFull);

	$('#page-dynamic-card').css('background', cssCardColor);
	switch (newColor) {
	case "grey":
	case "green":
	case "amber":
	case "red":
		var objSettings = JSON.parse(localStorage.getItem("TMSettings"));
		if (objSettings != null) {
			vibrateOn = objSettings.vibrateOnLimit;
		}
		if (vibrateOn) {
			navigator.vibrate(500);
		}
	}

}

function saveTimerData() {
	var timerId = new Date().getTime();

	var colorToSave = currentColor;
	if (colorToSave == "grey") {
		colorToSave = "";
	}
	saveDataToLocalStorage(String(timerId), $('#timerComment').val(), $(
			'#timer').text().substr(3), colorToSave);

	setTimeout(function() {
		$('#popup-timerdata-saved').popup();
		$('#popup-timerdata-saved').popup('open');
	}, 100);
	setTimeout(function() {
		$('#popup-timerdata-saved').popup("close");
	}, 2000);

}

function saveDataToLocalStorage(timerId, timerComment, timerDuration,
		timerLight) {
	var timerArr = JSON.parse(localStorage.getItem("TMTimed"));
	if (timerArr == null) {
		timerArr = {
			"TMTimed" : []
		};
	}
	var timer = {};
	timer["timerId"] = timerId;
	timer["comment"] = timerComment;
	timer["duration"] = timerDuration;
	timer["light"] = timerLight;
	timerArr.TMTimed.push(timer);
	localStorage.setItem("TMTimed", JSON.stringify(timerArr));
}

function updateTimerSettingsTitle(timerColor) {

	// console.log(timerColor + " " + $('#timer' + timerColor + 'Minutes').val()
	// + ":" + $('#timer' + timerColor + 'Seconds').val());
	var totalseconds = $('#timer' + timerColor).val();
	var minutes = (totalseconds - (totalseconds % 60)) / 60;
	var seconds = totalseconds % 60; // Modulo

	if (minutes == 0 && seconds == 0) {
		$('#Setting' + timerColor).html("");
	} else {
		if (seconds < 10) {
			seconds = "0" + seconds
		}
		; // add leading 0 if seconds is lower than 10
		$('#Setting' + timerColor).html(
				"&nbsp;" + minutes + ":" + seconds + "&nbsp;");
	}

}

// quick timer
var quickTimerMilliseconds = 0;
var quickTimerTotalMilliseconds = 0;
var quickTimerRed = 60;
var quickTimerInterval = 100;
var quickTimerEnabled = false;
var quickTimerReset = true;
var quickTimerStartTime;
var quickTimerOldTime;
var quickCurrentColor = "black";
var quickOldColor = "";
var myQuickTimer;

$(document).on('pagebeforeshow', '#page-quick-timer', function(event) {
	var btnActive = 0;

	btnActive = quickTimerRed / 60;
	$("#page-quick-timer #btn-qt-" + btnActive).addClass("ui-btn-active");
});

function updateQuickTimer() {
	var d = new Date();
	quickTimerMilliseconds = d - quickTimerStartTime;
	newQuickTimerValue(Math
			.round((quickTimerTotalMilliseconds + quickTimerMilliseconds) / 1000));
}

function setQuickTimerLimit(redTime) {
	quickTimerRed = redTime;
	if (quickTimerEnabled == true) {
		updateQuickTimer();
	}
}
function startStopQuickTimer() {
	var stayAwake = false;
	var objSettings;

	if (quickTimerEnabled == true) {
		// Stop quickTimer
		quickTimerEnabled = false;
		clearInterval(myQuickTimer);
		quickTimerTotalMilliseconds = quickTimerTotalMilliseconds
				+ quickTimerMilliseconds;
		// jQuery Mobile specific
		$('#quickTimerStartStopButton').text('Start');
		// $('#quick-timer-setting').removeClass("ui-disabled");
		$('#quickTimerResetButton').removeClass("ui-state-disabled");
		$('#quickTimerSaveButton').removeClass("ui-state-disabled");
		$('#page-quick-timer a[role="button"][data-rel="back"]').removeClass(
				"ui-state-disabled"); // Back button

		objSettings = JSON.parse(localStorage.getItem("TMSettings"));
		if (objSettings != null) {
			stayAwake = objSettings.stayAwakeWhileTiming;
		}
		if (stayAwake) {
			if (isRunningAsApp()) {
				window.plugins.insomnia.allowSleepAgain();
			}
		}
	} else {
		// Start quickTimer
		quickTimerEnabled = true;
		if (quickTimerReset == true) {
			quickTimerReset = false;
			quickTimerTotalMiliseconds = 0;
		}
		quickTimerStartTime = new Date();
		myQuickTimer = setInterval(updateQuickTimer, quickTimerInterval);
		// jQuery Mobile specific
		$('#quickTimerStartStopButton').text('Stop');
		// $('#quick-timer-setting').addClass("ui-disabled");
		$('#quickTimerResetButton').addClass("ui-state-disabled");
		$('#quickTimerSaveButton').addClass("ui-state-disabled");
		$('#page-quick-timer a[role="button"][data-rel="back"]').addClass(
				"ui-state-disabled"); // Back button

		newQuickTimerValue(Math.round(quickTimerTotalMilliseconds / 1000));

		objSettings = JSON.parse(localStorage.getItem("TMSettings"));
		if (objSettings != null) {
			stayAwake = objSettings.stayAwakeWhileTiming;
		}
		if (stayAwake) {
			if (isRunningAsApp()) {
				window.plugins.insomnia.keepAwake();
			}
		}
	}
}
function resetQuickTimer() {
	quickTimerReset = true;
	quickTimerTotalMilliseconds = 0;
	newQuickTimerValue(0);
}
function newQuickTimerValue(numSeconds) {
	var hh = 0, mm = 0, ss = 0, tempValue = 0;

	ss = numSeconds % 60;
	tempValue = numSeconds - ss;
	tempValue = tempValue / 60;
	mm = tempValue % 60;
	tempValue = tempValue - mm;
	h = tempValue / 60;

	if (hh < 10) {
		hh = "0" + hh;
	}
	if (mm < 10) {
		mm = "0" + mm;
	}
	if (ss < 10) {
		ss = "0" + ss;
	}

	// document.getElementById("timer").innerHTML = hh + ":" + mm + ":" + ss;
	$('#quick-timer').html(hh + ":" + mm + ":" + ss);

	if (quickTimerRed > 0 && numSeconds >= quickTimerRed) {
		quickCurrentColor = "red";
	} else if (quickTimerEnabled == true) {
		quickCurrentColor = "grey";
	} else {
		quickCurrentColor = "";
	}
	if (quickOldColor != quickCurrentColor) {
		quickOldColor = quickCurrentColor;
		setQuickNewColor(quickCurrentColor);

	}
}

function setQuickNewColor(newColor) {
	var cssColor = "";
	var vibrateOn = false;

	switch (newColor) {
	case "":
	case "black":
		cssColor = "";
		cssBackground = "";
		break;
	case "grey":
		cssColor = "lightgrey";
		cssBackground = "";
		break;
	case "red":
		cssColor = "white";
		cssBackground = "red";
		break;
	}

	$('#quick-timer').css('color', cssColor).css('background', cssBackground);
	switch (newColor) {
	case "red":
		var objSettings = JSON.parse(localStorage.getItem("TMSettings"));
		if (objSettings != null) {
			vibrateOn = objSettings.vibrateOnLimit;
		}
		if (vibrateOn) {
			navigator.vibrate(500);
		}
	}

}

// timerlist.js

var $timerArr;

$(document).on(
		'pagebeforeshow',
		'#page-timer-report',
		function(event) {

			$('#earlyTime').prop('checked', true).checkboxradio('refresh');
			$('#greenTime').prop('checked', true).checkboxradio('refresh');
			$('#amberTime').prop('checked', true).checkboxradio('refresh');
			$('#redTime').prop('checked', true).checkboxradio('refresh');
			$('#page-timer-report #report-summary').collapsible("option",
					"collapsed", false);

			readTimerDataFromLocalStorage();
		});

function readTimerDataFromLocalStorage() {
	var timerId;
	var timerComment = "";
	var timerDuration;
	var timerLight = "";
	var htmlRow = "";
	var totalEarly = 0;
	var totalGreen = 0;
	var totalAmber = 0;
	var totalRed = 0;
	var pctEarly = 0;
	var pctGreen = 0;
	var pctAmber = 0;
	var pctRed = 0;

	timerArr = JSON.parse(localStorage.getItem("TMTimed"));

	$('#ListDiv').empty();

	if (timerArr == null) {
		$('#NumEarly').prop("innerHTML",
				totalEarly + "&nbsp;(" + pctEarly + "%)");
		$('#NumGreen').prop("innerHTML",
				totalGreen + "&nbsp;(" + pctGreen + "%)");
		$('#NumAmber').prop("innerHTML",
				totalAmber + "&nbsp;(" + pctAmber + "%)");
		$('#NumRed').prop("innerHTML", totalRed + "&nbsp;(" + pctRed + "%)");
		$('#page-timer-report #summary-chart').hide();
		return;
	} else {
		$("#ListDiv")
				.append(
						'<ul id="List" data-role="listview" data-filter="true" data-input="#timerReportFilter" data-inset="true"></ul>');
		for (i = 0; i < timerArr.TMTimed.length; i++) {
			createRow = false;
			timerId = timerArr.TMTimed[i].timerId;
			timerComment = timerArr.TMTimed[i].comment;
			timerDuration = timerArr.TMTimed[i].duration;
			timerLight = timerArr.TMTimed[i].light;
			if (timerLight == "black") {
				timerLight = "";
			}
			switch (timerLight) {
			case "": {
				totalEarly++;
				if ($("#earlyTime").prop("checked")) {
					createRow = true;
				}
				;
				break;
			}
			case "green": {
				totalGreen++;
				if ($("#greenTime").prop("checked")) {
					createRow = true;
				}
				;
				break;
			}
			case "amber": {
				totalAmber++;
				if ($("#amberTime").prop("checked")) {
					createRow = true;
				}
				;
				break;
			}
			case "red": {
				totalRed++;
				if ($("#redTime").prop("checked")) {
					createRow = true;
				}
				;
				break;
			}
			}
			if (createRow) {
				if (timerLight == "") {
					timerImage = "blank";
				} else {
					timerImage = timerLight;
				}
				timerImage = "images/mark_" + timerImage + "_300x300.png"
				// $('#List').append("<li><table><tr><td><span
				// class='timercolor-" + timerLight + " + timer-li'>" +
				// timerDuration + "</span></td><td width='60px'>(" + timerLight
				// + ")</td><td>" + timerComment + "</td></tr></table></li>");
				htmlRow = "<li id='timerReportRow-"
						+ i
						+ "'>"
						+ "<a href='#'><table>"
						+ "<tr>"
						+ "<td>"
						+ timerDuration
						+ "</td>"
						+ "<td><img src='"
						+ timerImage
						+ "' width='16px'></td>"
						+ "<td>"
						+ timerComment
						+ "</td>"
						+ "</tr>"
						+ "</table></a>"
						+ "<a href='#' class='ui-btn ui-mini ui-btn-icon-notext ui-icon-delete' onclick='buttonClick(&quot;page-timer-report-deleteRow-"
						+ i + "&quot;)'>Delete</a>" + "</li>";
				$('#List').append(htmlRow);
			}
		}
		$('#List').listview();
		if (timerArr.TMTimed.length > 0) {
			pctEarly = Math.round(totalEarly / timerArr.TMTimed.length * 100);
			pctGreen = Math.round(totalGreen / timerArr.TMTimed.length * 100);
			pctAmber = Math.round(totalAmber / timerArr.TMTimed.length * 100);
			pctRed = Math.round(totalRed / timerArr.TMTimed.length * 100);
		} else {
			pctEarly = 0;
			pctGreen = 0;
			pctAmber = 0;
			pctRed = 0;
		}
		$('#NumEarly').prop("innerHTML",
				totalEarly + "&nbsp;(" + pctEarly + "%)");
		$('#NumGreen').prop("innerHTML",
				totalGreen + "&nbsp;(" + pctGreen + "%)");
		$('#NumAmber').prop("innerHTML",
				totalAmber + "&nbsp;(" + pctAmber + "%)");
		$('#NumRed').prop("innerHTML", totalRed + "&nbsp;(" + pctRed + "%)");
		/* Bar chart */
		if (pctEarly > 0) {
			$('#BarEarly').attr("width", pctEarly + "%");
			$('#page-timer-report #Early').show();
		} else {
			$('#page-timer-report #Early').hide();
		}
		if (pctGreen > 0) {
			$('#BarGreen').attr("width", pctGreen + "%");
			$('#page-timer-report #Green').show();
		} else {
			$('#page-timer-report #Green').hide();
		}
		if (pctAmber > 0) {
			$('#BarAmber').attr("width", pctAmber + "%");
			$('#page-timer-report #Amber').show();
		} else {
			$('#page-timer-report #Amber').hide();
		}
		if (pctRed > 0) {
			$('#BarRed').attr("width", pctRed + "%");
			$('#page-timer-report #Red').show();
		} else {
			$('#page-timer-report #Red').hide();

		}
		if (pctEarly == 0 && pctGreen == 0 && pctAmber == 0 && pctRed == 0) {
			$('#page-timer-report #summary-chart').hide();
		} else {
			$('#page-timer-report #summary-chart').show();
		}

	}
}

function deleteTimerReportRow(rowid) {

	$("#popup-timer-report-confirm-delete").popup("open");
	$(
			"#popup-timer-report-confirm-delete #popupTimerReportConfirmDeleteButtonContinue")
			.on("click", function() {
				// console.log("deleting row with rowid " + rowid);
				var timerArr = JSON.parse(localStorage.getItem("TMTimed"));
				timerArr.TMTimed.splice(rowid, 1);
				localStorage.setItem("TMTimed", JSON.stringify(timerArr));
				readTimerDataFromLocalStorage();
			});
	$("#popup-timer-report-confirm-delete")
			.on(
					"popupafterclose",
					function() {
						$(
								"#popup-timer-report-confirm-delete #popupTimerReportConfirmDeleteButtonContinue")
								.unbind("click");
					});

}

function removeDataFromLocalStorage() {
	$("#popup-timer-report-confirm-delete-all").popup("open");
	$(
			"#popup-timer-report-confirm-delete-all #popupTimerReportConfirmDeleteButtonContinue")
			.on("click", function() {
				localStorage.removeItem("TMTimed");
				readTimerDataFromLocalStorage();
				// $("#popup-timer-report-confirm-delete-all
				// #popupTimerReportConfirmDeleteButtonContinue").unbind("click");
			});
	$("#popup-timer-report-confirm-delete-all")
			.on(
					"popupafterclose",
					function() {
						$(
								"#popup-timer-report-confirm-delete-all #popupTimerReportConfirmDeleteButtonContinue")
								.unbind("click");
					});

}

// Settings

$(document).on('pagebeforeshow', '#page-settings', function(event) {
	readSettingsFromLocalStorage();
	if (isRunningAsApp()) {
		// Since the BuildInfo plugin doesn't work, hide the version information
		// $('#page-settings #version-info #version').html(BuildInfo.version);
		// $('#page-settings #version-info').show();
		$('#page-settings #version-info').hide();
	} else {
		$('#page-settings #version-info').hide();
		$('#vibrate').flipswitch("option", "disabled", true);
		$('#vibrate').flipswitch("refresh");
		$('#insomnia').flipswitch("option", "disabled", true);
		$('#insomnia').flipswitch("refresh");
		$('#insomnia-agenda').flipswitch("option", "disabled", true);
		$('#insomnia-agenda').flipswitch("refresh");
	}
});

$(document).on('pagebeforehide', '#page-settings', function(event) {
	saveSettingsToLocalStorage();
});

function readSettingsFromLocalStorage() {
	var vibrateOn = false;
	var stayAwake = false;
	var stayAwakeAgenda = false;
	var agendaRowHeight = 2;
	var agendaTimerButton = true;
	var easySpeakServer = "";

	var objSettings = JSON.parse(localStorage.getItem("TMSettings"));
	if (objSettings != null) {
		vibrateOn = objSettings.vibrateOnLimit;
		if (vibrateOn != null) {
			$('#vibrate').prop("checked", vibrateOn);
			$('#vibrate').flipswitch("refresh");
		}
		stayAwake = objSettings.stayAwakeWhileTiming;
		if (stayAwake != null) {
			$('#insomnia').prop("checked", stayAwake);
			$('#insomnia').flipswitch("refresh");
		}
		stayAwakeAgenda = objSettings.stayAwakeInAgenda;
		if (stayAwakeAgenda != null) {
			$('#insomnia-agenda').prop("checked", stayAwakeAgenda);
			$('#insomnia-agenda').flipswitch("refresh");
		}
		agendaRowHeight = objSettings.rowHeightAgenda;
		if (agendaRowHeight != null) {
			$('#agenda-row-height').prop("value", agendaRowHeight);
			$('#agenda-row-height').slider("refresh");
		}
		agendaTimerButton = objSettings.timerButtonAgenda;
		if (agendaTimerButton || agendaTimerButton == null) {
			$('#timerbutton-agenda-setting').prop("checked", "true")
					.checkboxradio("refresh");
			$('#row-selection-agenda-setting').checkboxradio("refresh");
		} else {
			$('#row-selection-agenda-setting').prop("checked", "true")
					.checkboxradio("refresh");
			$('#timerbutton-agenda-setting').checkboxradio("refresh");
		}
		easySpeakServer = objSettings.easySpeakServer;
		if (easySpeakServer == null) {
			easySpeakServer = "tmclub.eu";
		}
		$("#easyspeak-server").val(easySpeakServer);
		$("#easyspeak-server").selectmenu("refresh");

	}
}

function saveSettingsToLocalStorage() {
	var objSettings = {};

	var vibrateOn = $('#vibrate').prop("checked");
	objSettings["vibrateOnLimit"] = vibrateOn;

	var stayAwake = $('#insomnia').prop("checked");
	objSettings["stayAwakeWhileTiming"] = stayAwake;

	var stayAwakeAgenda = $('#insomnia-agenda').prop("checked");
	objSettings["stayAwakeInAgenda"] = stayAwakeAgenda;

	var agendaRowHeight = $('#agenda-row-height').val();
	objSettings["rowHeightAgenda"] = agendaRowHeight;

	var agendaTimerButton = $('#timerbutton-agenda-setting').prop("checked");
	objSettings["timerButtonAgenda"] = agendaTimerButton;

	var easySpeakServer = $("#easyspeak-server").val();
	objSettings["easySpeakServer"] = easySpeakServer;

	localStorage.setItem("TMSettings", JSON.stringify(objSettings));

}

function isRunningOnDevice() {
	if (navigator.userAgent
			.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/)) {
		return false; // Running as app
	} else {
		return true; // Running in a browser
	}
}

function isRunningAsApp() {
	// if protocol used is http or https then the app runs in a browser. If it's
	// a Cordova app, it uses the file:// protocol.
	return document.URL.indexOf('http://') === -1
			&& document.URL.indexOf('https://') === -1;
}

// Timerkeeper Cards
// / When Page is swiped to left or right, Move to next/previous page
$(document).on("swipeleft", ".page-timer-card[data-role=page]",
		function(event) {
			var pageRef = $("#btn-next", this).attr("href");
			if (pageRef != null) {
				// Using changePage instead of the newer navigate method,
				// because the reverse option hasn't been properly implemented
				// yet
				$.mobile.changePage(pageRef, {
					transition : "slide"
				});
			}
		});

$(document).on("swiperight", ".page-timer-card[data-role=page]",
		function(event) {
			console.log($("#btn-prev", this).attr("href"));
			var pageRef = $("#btn-prev", this).attr("href");
			if (pageRef != null) {
				// Using changePage instead of the newer navigate method,
				// because the reverse option hasn't been properly implemented
				// yet
				$.mobile.changePage(pageRef, {
					transition : "slide",
					reverse : true
				});
			}
		});
