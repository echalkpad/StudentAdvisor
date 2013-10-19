

// the model are all the domain/analysis/support model rules

SA.model = {

	// Sensor events
	events : {
		noise_level 		: [0],
		display_activity 	: [0],
		notification_sound 	: [0],
		// call  			: [0]
		// vibration 		: []
		// current_sound 	: []
	},

	// User events
	// userevent : {
	// 	typing 				: [0],
	// 	social_app_running 	: [0],
	// 	phone_is_moved 		: [0],
	// 	phone_is_used 		: [0]
	// },

	// Distraction state
	distraction : {
		display 		: [0],
		noise 			: [0],
		message 		: [0],
		// vibration 	: []
	},

	external_distraction_level : [0],

	// Self regulation
	selfRegulation : {
		attentional_control 	: [1],
		studying 				: [1],
		fatigue_level 			: [0],
		// personal_properties 	: [],
		total_study_time 		: 1,
		time_spend_studying 	: 0
	},

	// Agent choice
	agentChoice : {
		goal_switching_probability 			: [0],
		taking_break 						: [0],
		goal_switching_discrepancy		 	: [0],
		early_break_discrepancy 			: [0],
		suggest_break_action 				: [0],
		suggest_laterbreak_action			: [0],
		taking_suggest_break				: [0],
		optimal_goal_switching_level 		: 0.5,
		total_break_time 					: 0
	},

	// params and hardcoded stuff

	nr_distractions :  3,		// hardcoded. was lazy
	current_timestep : 1,		// the current time step number ( 0 is initialized values, so model starts at 1)
	maxLength : 100,			// max length of all matrices

	maxBgSoundDiff : 9,			// max. difference between noise sensor and background sound level - in dB
	SndThreshold : 5,			// threshold for notification sound - in dB
	fatigueIncrease : 0.02,		// increase of fatigue level from model
	fatigueDecrease : 0.015,		// decrease of fatigue level from model
	taking_suggest_break : false,	// flag to see if user is taking a suggested break!

	// SIGNALS (for support actions)
	
	suggestedBreak : new signals.Signal(),
	suggestedLaterBreak : new signals.Signal(),


	update : function() {
		
		// console.info('MODEL: updating triggered...');
		// console.info('MODEL: retrieving sensor values from common sense...');
		
		// to battle synchronicity bugs, update function is passed as callback.
		// then after all sensors have updated (signal count function) execute this
		// callback
		SA.commonSense.retrieveAllSensorValues(function() {
			SA.model.updateModel();
			SA.model.current_timestep++;
			if(SA.currentSection === 'feedback')	// update the graph if one is looking at that section!
				SA.createFeedbackSection();		
		});

	},

	updateModel : function() {
		
		var t = this.current_timestep;

		function truncateMatrix() {

			var matrices = [events, userevent, distraction, selfRegulation, agentChoice];

			// trim all arrays so that they don't grow too large
			for(var i = 0; i < matrices.length; i++) {
				var matrixObject = matrices[i];
				for (var key in matrixObject) {
					if(matrixObject.hasOwnProperty(key)) {
						var obj = matrixObject[key];
						if(Array(obj).length > this.maxLength)
							obj.shift();
						// console.log(obj);
					}
				}
			}

			// also trim the external distraction level array
			if(this.external_distraction_level.length > this.maxLength)
				this.external_distraction_level.shift();
			
		}

		// console.info('MODEL: updating model...' + ', current timestep: ', this.current_timestep, ' event matrix size: ', this.distraction.message.length);
		
		
		// define some shortcut variables
		var study_with_music = SA.personalProperties.study_with_music;
		var sensorMatricesRaw = SA.commonSense.sensorMatricesRaw;
		var sensorMatrix = SA.commonSense.sensorMatrices;
		var background_soundlevel = SA.commonSense.background_soundlevel;

		var events = this.events;
		var distraction = this.distraction;
		var selfRegulation = this.selfRegulation;
		var agentChoice = this.agentChoice;
		var userevent = this.userevent;



		// ============================================================
		// USER ACTIONS (TAKING BREAK) ================================
		// ============================================================
		
		if(SA.startedStudy === false)
			agentChoice.taking_break[t] = 1;
		else if(SA.startedStudy === true)
			agentChoice.taking_break[t] = 0;



		// ============================================================
		// MODEL SENSOR EVENTS (NOT RAW SENSOR VALUES) ================
		// ============================================================

		events.display_activity[t] = sensorMatrix.screen_activity[t];
		// events.vibration[t] = sensorMatrix.screen_activity[t];
		
		// example: noise sensor1: (62.9 - 30) > 10  32.9 > 10 == true
		console.log('noise level calculation: ', sensorMatrix.noise_sensor1[t], background_soundlevel, this.maxBgSoundDiff, (sensorMatrix.noise_sensor1[t] - background_soundlevel), (sensorMatrix.noise_sensor1[t] - background_soundlevel) > this.maxBgSoundDiff);
		if ((sensorMatrix.noise_sensor1[t] - background_soundlevel) > this.maxBgSoundDiff)
			events.noise_level[t] = 1;
		else
			events.noise_level[t] = 0;

		// WHEN IS THERE A NOTIFICATION SOUND?
		// if there is more noise than previous timestep + 5 db?
		if (t > 0) {
			if(sensorMatrix.noise_sensor1[t - 1] > 0) {
				if (sensorMatrix.noise_sensor1[t] >= (sensorMatrix.noise_sensor1[t - 1] + this.SndThreshold))
					events.notification_sound[t] = 1
				else
					events.notification_sound[t] = 0
			} else {
				events.notification_sound[t] = 0
			}
		}

		// DETECT CALL STATE
		// if (sensorMatrix.call_state[t] === 1)
		// 	events.call[t] = 1;
		// else
		// 	events.call[t] = 0;
		


		// ============================================================
		// MODEL DISTRACTIONS =========================================
		// ============================================================
		
		if (events.display_activity[t] === 1)
			distraction.display[t] = 1 / (this.nr_distractions);
		else
			distraction.display[t] = 0;

		// VIBRATION NOT IMPLEMENTED
		// if (sensorMatrix.vibration[t] === 1)
		// 	distraction.vibration[t + 1] = 1 / (this.nr_distractions);
		// else
		// 	distraction.vibration[t + 1] = 0;
		
		if (events.noise_level[t] === 1 || events.notification_sound[t] === 1)		//study_with_music === 1 || ?huh
			distraction.noise[t] = 1 / (this.nr_distractions);
		else
			distraction.noise[t] = 0;
		
		// DETECT UNREAD MESSAGE BY NOTIFICATION SOUND OR DETECT UNREAD MESSAGE DIRECTLY
		if (events.notification_sound[t] === 1 || sensorMatrix.unread_msg[t] === 1)
			distraction.message[t] = 1 / (this.nr_distractions);
		else
			distraction.message[t] = 0;



		// ============================================================
		// EXTERNAL DISTRACTION LEVEL =================================
		// ============================================================
		
		var sumDistractions = distraction.display[t] + distraction.noise[t] + distraction.message[t]; // + distraction.vibration[t]
	    this.external_distraction_level[t] = sumDistractions;


		
	    // ============================================================
		// ATTENTIONAL CONTROL MODEL ===================================
		// ============================================================

	    // taking break and taking suggest break stay the same as their previous value.
		// agentChoice.taking_break[t] = agentChoice.taking_break[t - 1];
		agentChoice.taking_suggest_break[t] = agentChoice.taking_suggest_break[t - 1];

		// Increase of fatigue during studying
		if (agentChoice.taking_break[t] === 0) {
			selfRegulation.studying[t] = 1;
			selfRegulation.fatigue_level[t] = selfRegulation.fatigue_level[t - 1] + this.fatigueIncrease;
		}

		// cap fatigue level at 1
		selfRegulation.fatigue_level[t] = Math.min(selfRegulation.fatigue_level[t], 1);
		
		// increase study (timesteps)
		selfRegulation.total_study_time++;



		// ============================================================
		// ADJUSTING ATTENTIONAL CONROL ===============================
		// ============================================================
		
		// Adjusting attentional control
		selfRegulation.attentional_control[t] = selfRegulation.attentional_control[t - 1] - (selfRegulation.fatigue_level[t - 1] / 50);
		
		// cap attentional control level at 0
		selfRegulation.attentional_control[t] = Math.max(selfRegulation.attentional_control[t], 0);



		// ============================================================
		// GOAL PROBABILITY ===========================================
		// ============================================================
		
		// goal switching probability
	    agentChoice.goal_switching_probability[t] = ((1 - selfRegulation.attentional_control[t]) * this.external_distraction_level[t]);

		agentChoice.goal_switching_discrepancy[t] = agentChoice.goal_switching_probability[t] - agentChoice.optimal_goal_switching_level;

		if (agentChoice.goal_switching_discrepancy[t] < 0)
			agentChoice.early_break_discrepancy[t] = 1;
		else
			agentChoice.early_break_discrepancy[t] = 0;

		if (agentChoice.goal_switching_discrepancy[t] >= 0 && agentChoice.taking_break[t] === 0) {
			agentChoice.suggest_break_action[t] = 1;
			this.suggestedBreak.dispatch();	// dispatch support action signal
		} else {
			agentChoice.suggest_break_action[t] = 0;
		}
    	


		// ============================================================
		// START AND END OF BREAK =====================================
		// ============================================================
		
		// suggesting a later break (IF user is not taking a suggested break)
	    if (agentChoice.taking_break[t] === 1 && this.taking_suggest_break === false && agentChoice.early_break_discrepancy[t] === 1) {
	        
			agentChoice.suggest_laterbreak_action[t] = 1;
			this.suggestedLaterBreak.dispatch();
				
	    } else {

	    	agentChoice.suggest_laterbreak_action[t] = 0;

	    }
		
		// Effect of taking break on fatigue and attentional control
	    if (agentChoice.taking_break[t] === 1) {
	        selfRegulation.fatigue_level[t] = selfRegulation.fatigue_level[t - 1] - this.fatigueDecrease; 
	        selfRegulation.attentional_control[t] = selfRegulation.attentional_control[t - 1] + (selfRegulation.fatigue_level[t] / 50);
	        agentChoice.total_break_time++;
	        selfRegulation.studying[t] = 0;
	    }



	    // ============================================================
		// LOGGING STUFF FOR ANALYSIS =================================
		// ============================================================
		
		console.log('raw sensor matrix: ', sensorMatricesRaw);
		// console.log(sensorMatrix);

		console.log('events: ', events);
		console.log('distractions: ', distraction);
		// console.log('self regulation: ', selfRegulation);
		// console.log('fatigue level: ', selfRegulation.fatigue_level[t]);
		// console.log('attentional control: ', selfRegulation.attentional_control[t]);
		console.log('external distractions: ', this.external_distraction_level);

		console.log("%cStudying: " + selfRegulation.studying[t], "color: blue; font-size: x-large");
		// console.log("%cThis will be formatted with large, blue text", "color: red; font-size: x-large");
		
		// console.log('goal switching probability: ', agentChoice.goal_switching_probability);
		// console.log('goal switching discrepancy: ', agentChoice.goal_switching_discrepancy);
		// console.log('agent choice: ', agentChoice);
		

	}

}





