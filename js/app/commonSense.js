

// logic related to common sense os

SA.commonSense = {
		
	unixTimeStampSinceStart : Math.round(0 + new Date() / 1000),
	loggedIn : false,
	sessionId : '',
	sensorUpdated : new signals.Signal(),
	sensorUpdatedBinding : null,

	allSensorIds : [
		[413563, 'light'],
		[413565, 'noise_sensor1'],			// difference between these two? no idea.
		[413566, 'noise_sensor2'],
		[413569, 'loudness'],
		[413580, 'accelerometer'],
		[413582, 'linear_acceleration'],
		[413583, 'orientation'],
		[413585, 'screen_activity'],
		[413587, 'call_state'],
		[413594, 'unread_msg']
	],

	sensorMatricesRaw : {
		light : 				[0],
		noise_sensor1 : 		[0],
		noise_sensor2 : 		[0],
		loudness : 				[0],
		accelerometer : 		[0],
		linear_acceleration : 	[0],
		orientation : 			[0],
		screen_activity : 		[0],
		call_state : 			[0],
		unread_msg : 			[0]
	},

	sensorMatrices : {
		light : 				[0],
		noise_sensor1 : 		[0],
		noise_sensor2 : 		[0],
		loudness : 				[0],
		accelerometer : 		[0],
		linear_acceleration : 	[0],
		orientation : 			[0],
		screen_activity : 		[0],
		call_state : 			[0],
		unread_msg : 			[0]
	},

	background_soundlevel : 45,				// one-time measurement, hardcoded for simplicity

	loginUrl : 'https://api.sense-os.nl/login',
	logoutUrl : 'https://api.sense-os.nl/logout',
	sensorUrl : 'https://api.sense-os.nl/sensors/sensor_id/data.json',
	sensorsUrl : 'https://api.sense-os.nl/sensors',
	deviceUrl : 'https://api.sense-os.nl/devices/{id}',
	devicesUrl : 'https://api.sense-os.nl/devices',


	login : function() {
	
		if(SA.commonSense.sessionId === '' || (SA.commonSense.sessionId.length > 0) === false) {
			
			console.info('INFO: logging into common sense os...');
			
			$.ajax({
				type: 'POST',
				url: SA.commonSense.loginUrl,
				data : {
					"username": SA.accountInfo.username,
					"password": SA.accountInfo.hashedPassword
				},
				headers : {
					"Accept" : "*/*"
				},
				cache : false,
				success : function(data, status, xhr) {
					console.info('INFO: logged into common sense completed.');
					console.info('INFO: session ID: ', data.session_id);
					SA.commonSense.sessionId = data.session_id + '';
					SA.commonSense.loggedIn = true;
					// enable start studying button
					$('#startStudyingButton').removeAttr('disabled');
					$('#startStudyingButton').html('start studying!');
				}
			});
		} else {

			console.info('INFO: already logged into common sense os!');			
		}
	},

	logout : function () {

		console.info('INFO: logging out of common sense os...');
		
		if(SA.commonSense.loggedIn == true) {

			$.ajax({
				type: 'POST',
				url: SA.commonSense.logoutUrl,
				headers : {
					"Accept" : "*/*",
					"X-SESSION_ID" : SA.commonSense.sessionId
				},
				cache : false,
				success : function(data, status, xhr) {
					console.info('INFO: logging out of common sense completed.');
					SA.commonSense.sessionId = '';
					SA.commonSense.loggedIn = false;
				}
			});
		} else {
			console.info('INFO: no common sense session, log in first...');
		}
	},

	retrieveAllSensors : function() {

		console.info('INFO: getting all sensors...');
		
		if(SA.commonSense.loggedIn == true) {

			$.ajax({
				type: 'GET',
				url: SA.commonSense.sensorsUrl,
				headers : {
					"Accept" : "*/*",
					"X-SESSION_ID" : SA.commonSense.sessionId
				},
				cache : false,
				success : function(data, status, xhr) {
					console.info('INFO: sensor request completed.');
					console.log(data);
				}
			});
		} else {
			console.info('INFO: no common sense session, log in first...');
		}
	},

	retrieveSensorValue : function(sensor) {

		// console.info('INFO : COMMONSENSE :: getting individual sensor data...');
		
		// replace the sensor ID in the sensorUrl
		var sensorId = sensor[0];
		var sensorType = sensor[1];
		var fixedSensorUrl = SA.commonSense.sensorUrl.replace("sensor_id", sensorId);
		var unixTimeStamp = Math.round(0 + new Date() / 1000);

		var getData = {
			// date :
			start_date : SA.commonSense.unixTimeStampSinceStart,
			end_date : unixTimeStamp,
			last : true
		};

		if(SA.commonSense.loggedIn == true) {
			
			// console.log('LOG : COMMONSENSE :: requesting: ' + sensorType + '\nFrom date: ', getData.start_date, ' to date: ', getData.end_date, ' and sensorID: ', sensorId);

			$.ajax({
				type: 'GET',
				url: fixedSensorUrl,
				data : getData,
				headers : {
					"Accept" : "*/*",
					"X-SESSION_ID" : SA.commonSense.sessionId
				},
				cache : false,
				success : function(returnedObject, status, xhr) {
					// console.log('LOG : COMMONSENSE :: sensor request completed.');
					// console.log('LOG : COMMONSENSE :: ' + sensorType + ', returnedObject: ', returnedObject);
					SA.commonSense.updateSensor(sensorType, returnedObject);
					// signal that this sensor has updated
					SA.commonSense.sensorUpdated.dispatch(sensorType);
				}
			});
		} else {
			console.info('INFO : COMMONSENSE :: no common sense session, log in first...');
		}
	},

	retrieveAllSensorValues : function(modelUpdateFunction) {

		// number of sensors that have been updated ($.AJAX successful)
		var numSensorsUpdated = 0;

		// only execute callback if all sensors have updated;
		SA.commonSense.sensorUpdatedBinding = SA.commonSense.sensorUpdated.add(function(sensorType) {
			// console.log('sensor updated: ' + sensorType);
			numSensorsUpdated++;
			if(numSensorsUpdated == SA.commonSense.allSensorIds.length) {
				// console.info('\nINFO : COMMONSENSE :: executing model update function...\n');
				SA.commonSense.sensorUpdatedBinding.detach();
				modelUpdateFunction();
			}
		});

		// UPDATE EACH INDIVIDUAL SENSOR
		// retrieve last sensor values for each sensor
		// results in 10 GET requests per time interval.
		// d'oh. But the dumbass REST interface of common sense is to blame.
		for (var i = 0; i < SA.commonSense.allSensorIds.length; i++) {
			
			var sensor = SA.commonSense.allSensorIds[i];
			SA.commonSense.retrieveSensorValue(sensor);

		}
	},

	updateSensor : function(sensorType, returnedObject) {

		var sensorValue = returnedObject;

		function getRealValue() {
			
			var realValue = 0;

			if(typeof returnedObject !== 'undefined' && typeof returnedObject != 'undefined') {
				if(returnedObject.data.length > 0)
					realValue = returnedObject.data[0].value;	
			}
			// console.log(realValue);

			return realValue;
		}

		// process individual sensor values
		switch(sensorType) {

			case 'light':
				// we will have to remove the 'lux' text and shit: 	value: "{"lux":10}"
				// console.log('LIGHT: raw sensor value: ', sensorValue);
				SA.commonSense.sensorMatricesRaw.light.push(sensorValue);
				sensorValue = getRealValue();
				if(sensorValue !== 0) {
					sensorValue = $.parseJSON(sensorValue).lux;
				}
				SA.commonSense.sensorMatrices.light.push(sensorValue);
			break;

			case 'noise_sensor1':
				// console.log('NOISE SENSOR 1: raw sensor value: ', sensorValue);
				SA.commonSense.sensorMatricesRaw.noise_sensor1.push(sensorValue);
				sensorValue = getRealValue();
				//TODO logic to detect incoming message sound
				SA.commonSense.sensorMatrices.noise_sensor1.push(sensorValue);
			break;

			case 'noise_sensor2':
				// console.log('NOISE SENSOR 2: raw sensor value: ', sensorValue);
				SA.commonSense.sensorMatricesRaw.noise_sensor2.push(sensorValue);
				sensorValue = getRealValue();
				//TODO logic to detect incoming message sound
				SA.commonSense.sensorMatrices.noise_sensor2.push(sensorValue);
			break;

			case 'loudness':
				// console.log('LOUDNESS: raw sensor value: ', sensorValue);
				SA.commonSense.sensorMatricesRaw.loudness.push(sensorValue);
				sensorValue = getRealValue();
				SA.commonSense.sensorMatrices.loudness.push(sensorValue);
			break;

			case 'accelerometer':
				// value: "{"x-axis":0.15,"y-axis":8.649,"z-axis":1.798}"
				// console.log('ACCELEROMETER: raw sensor value: ', sensorValue);
				SA.commonSense.sensorMatricesRaw.accelerometer.push(sensorValue);
				sensorValue = getRealValue();
				if(sensorValue !== 0) {
					sensorValue = $.parseJSON(sensorValue);
				}
				//TODO complicated logic pertaining to acceleratometer change.
				SA.commonSense.sensorMatrices.accelerometer.push(sensorValue);
			break;

			case 'linear_acceleration':
				// value: "{"x-axis":0,"y-axis":0,"z-axis":0}"
				// console.log('LIN. ACCELERATION: raw sensor value: ', sensorValue);
				SA.commonSense.sensorMatricesRaw.linear_acceleration.push(sensorValue);
				sensorValue = getRealValue();
				if(sensorValue !== 0) {
					sensorValue = $.parseJSON(sensorValue);
				}
				//TODO complicated logic pertaining to linear acceleration change.
				SA.commonSense.sensorMatrices.linear_acceleration.push(sensorValue);
			break;

			case 'orientation':
				// value: "{"pitch":-78,"roll":0,"azimuth":115}"
				// console.log('ORIENTATION: raw sensor value: ', sensorValue);
				SA.commonSense.sensorMatricesRaw.orientation.push(sensorValue);
				sensorValue = getRealValue();
				if(sensorValue !== 0) {
					sensorValue = $.parseJSON(sensorValue);
				}
				// TODO complicated logic pertaining to orientation change.
				SA.commonSense.sensorMatrices.orientation.push(sensorValue);
			break;

			case 'screen_activity':
				// value: "{"screen":"on"}"
				// console.log('SCREEN ACTIVITY: raw sensor value: ', sensorValue);
				SA.commonSense.sensorMatricesRaw.screen_activity.push(sensorValue);
				sensorValue = getRealValue();
				if(sensorValue !== 0) {
					// console.log('extracting screen activity value...');
					sensorValue = $.parseJSON(sensorValue).screen;
					sensorValue === 'on' ? sensorValue = 1 : sensorValue = 0;
				}
				SA.commonSense.sensorMatrices.screen_activity.push(sensorValue);
			break;

			case 'call_state':
				// value: "{"state":"idle"}"
				// console.log('CALL STATE: raw sensor value: ', sensorValue);
				SA.commonSense.sensorMatricesRaw.call_state.push(sensorValue);
				sensorValue = getRealValue();
				if(sensorValue !== 0) {
					sensorValue = $.parseJSON(sensorValue).state;
					sensorValue === 'idle' ? sensorValue = 0 : sensorValue = 1;	
				}
				SA.commonSense.sensorMatrices.call_state.push(sensorValue);
			break;

			case 'unread_msg':
				//TODO find out if this sensor works yes or no.. haha. value: "false"
				// console.log('UNREAD MESSAGE: raw sensor value: ', sensorValue);
				SA.commonSense.sensorMatricesRaw.unread_msg.push(sensorValue);
				sensorValue = getRealValue();
				// console.log('unread_msg', sensorValue);
				if(sensorValue !== 0) {
					// sensorValue = $.parseJSON(sensorValue);
					sensorValue == 'false' ? sensorValue = 0 : sensorValue = 1;	
				}
				SA.commonSense.sensorMatrices.unread_msg.push(sensorValue);
			break;
		};
	}
}



