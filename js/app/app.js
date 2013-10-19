

// global (SO = Study Advisor) namespace object

var SA = {

	// all sorts of helper functions
	HELPERFN : {

		attachTapListener : function(zeptoSelector, callback) {
			$(zeptoSelector).on('tap', callback);
			// $(zeptoSelector).on('click', callback);
		},

		attachTapListenerOnce : function(zeptoSelector, callback) {
			$(zeptoSelector).one('tap', callback);
			// $(zeptoSelector).one('click', callback);
		},

		removeTapListener : function(zeptoSelector) {
			$(zeptoSelector).off('tap');
			// $(zeptoSelector).one('click');
		}

	},

	// app variables
	firstStart : true,
	startedStudy : false,
	currentSection : 'study',

	// app logic
	personalProperties : {},	// defined in personalProperties.js		logic related to personal properties
	commonSense : {},			// defined in commonSense.js			logic related to study activity
	timeKeeper : {},			// defined in timeKeeper.js				logic related to keeping track of time
	model : {},					// defined in model.js					the main model of the application


	// functions of application
	initialize : function() {

		// login to common sense
		SA.commonSense.login();

		// attach listeners to main menu
		SA.HELPERFN.attachTapListener($('#nav_study'), function(event) {
			SA.activateSection('study');
		});

		SA.HELPERFN.attachTapListener($('#nav_feedback'), function(event) {
			SA.activateSection('feedback');
		});

		SA.HELPERFN.attachTapListener($('#nav_achievements'), function(event) {
			SA.activateSection('achievements');
		});

		SA.activateSection('study');

	},

	activateSection : function(sectionName) {
		
		console.info('INFO: switching section to ' + sectionName);

		function deactivateAll() {
			$('#nav_study').removeClass('active');
			$('#nav_feedback').removeClass('active');
			$('#nav_achievements').removeClass('active');
			$('#study').addClass('hidden');
			$('#feedback').addClass('hidden');
			$('#achievements').addClass('hidden');
		}

		function activate(sectionName) {
			$('#' + sectionName).removeClass('hidden');
			// $('#' + sectionName).addClass('flipInY');
		}

		switch(sectionName) {

			case 'study':
				SA.currentSection = 'study';
				deactivateAll();

				// decide what subsection should be shown
				if(SA.startedStudy == true)
					SA.createRunningSection();
				else
					SA.createStartSection();
					
				// activate like other sections
				$('#nav_study').addClass('active');
				activate(sectionName);

			break;

			case 'feedback':
				SA.currentSection = 'feedback';
				deactivateAll();
				$('#nav_feedback').addClass('active');
				SA.createFeedbackSection();
				activate(sectionName);
			break;

			case 'achievements':
				SA.currentSection = 'achievements';
				deactivateAll();
				$('#nav_achievements').addClass('active');
				SA.createAchievementsSection();
				activate(sectionName);
			break;

		}
	},

	createRunningSection : function () {
		$('#study #running').removeClass('hidden');
		$('#study #start').addClass('hidden');

		SA.HELPERFN.removeTapListener($('#startStudyingButton'));
		SA.HELPERFN.removeTapListener($('#breakStudyingButton'));

		// BREAK BUTTON
		SA.HELPERFN.attachTapListenerOnce($('#breakStudyingButton'), function(event){
			SA.startedStudy = false;
			// SA.timeKeeper.stop();
			SA.activateSection('study');
			console.log('tapped take study break...');
		});
	},

	createStartSection : function () {
		$('#study #start').removeClass('hidden');
		$('#study #running').addClass('hidden');
		
		// REMOVE ALL BUTTON LISTENERS TO BE SURE
		SA.HELPERFN.removeTapListener($('#startStudyingButton'));
		SA.HELPERFN.removeTapListener($('#breakStudyingButton'));

		SA.HELPERFN.removeTapListener($('#agreeButton'));
		SA.HELPERFN.removeTapListener($('#disagreeButton'));

		SA.HELPERFN.removeTapListener($('#agreeButton2'));
		SA.HELPERFN.removeTapListener($('#disagreeButton2'));

		// START STUDYING BUTTON
		SA.HELPERFN.attachTapListenerOnce($('#startStudyingButton'), function(event){
			SA.startedStudy = true;
			SA.model.taking_suggest_break = false;
			SA.model.agentChoice.taking_break[SA.model.current_timestep] = 0;
			SA.timeKeeper.start();
			
			// ATTACH SIGNAL EVENTS FOR SUPPORT ACTIONS
			SA.model.suggestedBreak.add(function() {

				SA.HELPERFN.removeTapListener($('#agreeButton'));
				SA.HELPERFN.removeTapListener($('#disagreeButton'));
				$('.suggestBreak').removeClass('hidden');	// show modal
				$('.suggestBreak').addClass('onTop');		// put on top!

				SA.HELPERFN.attachTapListenerOnce($('#agreeButton'), function(event){
					SA.startedStudy = false;
					SA.model.agentChoice.taking_break[SA.model.current_timestep] = 1;
					SA.model.taking_suggest_break = true;			// flag to not get suggest LATER break actions...
					$('.suggestBreak').addClass('hidden');
					$('.suggestBreak').removeClass('onTop');
					SA.activateSection('study');
				});

				SA.HELPERFN.attachTapListenerOnce($('#disagreeButton'), function(event){
					SA.startedStudy = true;
					SA.model.agentChoice.taking_break[SA.model.current_timestep] = 0;
					$('.suggestBreak').addClass('hidden');
					$('.suggestBreak').removeClass('onTop');
					SA.activateSection('study');
				});

				console.log('%c\n=======================================', "color: blue; font-size: large");
				console.log('%cSUGGESTED BREAK ACTION SIGNAL FIRED !!!', "color: blue; font-size: large");
				console.log('%c=======================================\n', "color: blue; font-size: large");

			});

			SA.model.suggestedLaterBreak.add(function() {

				SA.HELPERFN.removeTapListener($('#agreeButton2'));
				SA.HELPERFN.removeTapListener($('#disagreeButton2'));
				$('.suggestLaterBreak').removeClass('hidden');
				$('.suggestLaterBreak').addClass('onTop');		// put on top!

				SA.HELPERFN.attachTapListenerOnce($('#agreeButton2'), function(event){
					SA.startedStudy = true;
					SA.model.agentChoice.taking_break[SA.model.current_timestep] = 0;
					$('.suggestLaterBreak').addClass('hidden');
					$('.suggestLaterBreak').removeClass('onTop');
				});

				SA.HELPERFN.attachTapListenerOnce($('#disagreeButton2'), function(event){
					SA.startedStudy = false;
					SA.model.agentChoice.taking_break[SA.model.current_timestep] = 1;
					$('.suggestLaterBreak').addClass('hidden');
					$('.suggestLaterBreak').removeClass('onTop');
				});

				// console.log("%cStudying: " + selfRegulation.studying[t], "color: blue; font-size: x-large");
				console.log('%c\n=============================================', "color: red; font-size: large");
				console.log('%cSUGGESTED LATER BREAK ACTION SIGNAL FIRED !!!', "color: red; font-size: large");
				console.log('%c=============================================\n', "color: red; font-size: large");

			});
	
			// THE FOLLOWING IS FOR TESTING PURPOSES, TEST IF POPUP WORKS
			// setInterval(function(){
			// 	SA.model.suggestedBreak.dispatch();
			// 	// SA.model.suggestedLaterBreak.dispatch();
			// }, 1000);

			SA.activateSection('study');
			console.log('tapped start study...');
		});
	},

	createFeedbackSection : function () {

		var timestep = SA.model.current_timestep;
		var numDataPoints;

		var graphData = [];			// this graph's main data
		var data = [
			[],
			[],
			[],
			[],
			[],
			[]
		];


		if(timestep > 100)
			numDataPoints = SA.model.maxLength;
		else
			numDataPoints = timestep;


		for(var i = 0; i < numDataPoints; i++) { 
			
			var printStep = timestep - (numDataPoints - i);
			// data.labels.push(printStep);

			var distractionLevel = SA.model.external_distraction_level;
			var fatigue = SA.model.selfRegulation.fatigue_level;
			var attControl = SA.model.selfRegulation.attentional_control;

			var GSP = SA.model.agentChoice.goal_switching_probability;
			var OGS = SA.model.agentChoice.optimal_goal_switching_level;
			var suggestedBreak = SA.model.agentChoice.suggest_break_action;
			
			data[0].push(distractionLevel[printStep]);
			data[1].push(fatigue[printStep]);
			data[2].push(attControl[printStep]);

			data[3].push(GSP[printStep]);
			data[4].push(OGS);
			data[5].push(suggestedBreak);

		}

		var dataNames = [
			'distraction level', 
			'fatigue', 
			'attentional control', 
			'goal switch probability', 
			'optimal goal switching level', 
			'suggested break action'
		];

		var lineSizes = [
			4,
			3,
			3,
			5,
			3,
			6,
		];

		for(var j = 0; j < data.length; j++) {

			var dataName = dataNames[j];
			var graphType;

			if(j != 5)
				graphType = "line";
			else
				graphType = "column";

			var graphDataItem = {
				type : graphType,
				name : dataName,
				lineThickness : lineSizes[j],
				showInLegend : true,
				legendMarkerType : "square",
		        markerType : "none",
		        legendText : dataName,
				dataPoints : []
			};

			for(var k = 0; k < data[j].length; k++) {
				
				var currentData = data[j][k];

				graphDataItem.dataPoints.push({
					label : k,
					y : currentData
				});
				
			}

			graphData.push(graphDataItem);

		}

		var chart = new CanvasJS.Chart("chartInfoDiv", {

			width : 470,	//in pixels
			height : 300,	//in pixels

			backgroundColor: "rgba(0, 0, 0, 0)",
			colorSet: "studyAdvisor",

			title : {
				text: ""              
			},
			
			axisX: {
				// interval : 1,
				// tickColor: "red",
				// tickLength: 5,
				includeZero: true,
				minimum: 0,
        		maximum: 100,
				// tickThickness: 2,
		        gridColor : "rgba(0, 0, 0, 0.2)",
		        lineColor : "rgba(0, 0, 0, 0.2)",
		        interlacedColor: "rgba(0, 0, 0, 0.1)"
			},
			
			axisY:{
				interval : 0.1,
				minimum: 0,
        		maximum: 1.1,
				// tickThickness: 2,
				gridColor: "rgba(0, 0, 0, 0.2)",
				lineColor : "rgba(0, 0, 0, 0.2)"
			},

			legend: {
				verticalAlign: "bottom"
			},
			
			data : graphData

		});

		chart.render();

	},

	createAchievementsSection : function () {



	}

};



//colorSet Array
CanvasJS.addColorSet("studyAdvisor",
    [
	    "#FF0000",		// distraction level	
	    "#FFFF00",		// fatigue
	    "#00FF00",		// attentional control
	    "#0000FF",		// goal switch probability
	    "#00FFFF",		// optimal goal switching level
	    "#000000"		// suggested break action
    ]
);





