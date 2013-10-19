

// time keeper keeps watch over study time etc.

SA.timeKeeper = {

	timeInterval : 5000,
	timeStudiedSeconds : 0,
	timeKeeperIntervalId : null,

	update : function() {
		// console.info('TIMEKEEPER: updating triggered...');
		SA.model.update();
	},

	start : function () {
		console.info('TIMEKEEPER: starting time...');
		var that = this;
		clearInterval(that.timeKeeperIntervalId);
		that.timeKeeperIntervalId = setInterval(function() {
			// using apply here, because 'this' should point to this object...
			// http://stackoverflow.com/questions/133973/how-does-this-keyword-work-within-a-javascript-object-literal
			that.update.apply(that);
		}, that.timeInterval);
	},

	stop : function () {
		console.info('TIMEKEEPER: stopping time...');
		var that = this;
		clearInterval(that.timeKeeperIntervalId);
	}

}