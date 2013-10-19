StudentAdvisor
==============

Project for master course model-based intelligent environments at Vrije Universiteit Amsterdam

Simple phonegap HTML / CSS webapp 'hardcoded' for 480 * 800 android screen size.
Keeps track of distractions and advises when to take a break (or to take a later break)
simply using sensor values from a smartphone itself in combination with a computational model that was designed in the course 'Model based intelligent environments', tought at the Vrije Universiteit Amsterdam.

For sensing the smartphone values, we used a framework called 'Common Sense OS', which makes it easier to obtain smartphone sensor values.


Running our prototype
---------------------

If you would like to test the prototype, there are a number of things you have to do:

1. **First**, create a common sense account. One can do so here: [Common Sense OS](https://common.sense-os.nl/)
  (otherwise you cannot obtain data from your own smartphone, at least not with this prototype)

2. **Second**, after common sense account creation, create an MD5 hash of one's account password, which can be done here: [MiracleSalad md5 hashgenerator](http://www.miraclesalad.com/webtools/md5.php)

3. **Third**: input one's username and hashed password (created in step 2) into the accountInfo.js file (shows itself).


Quirks
------

- **There might be a delay in doing something on your smartphone and the changes of this reflecting in the graph in the prototype**. This is because first sensor data is uploaded to common sense, and afterwards retrieved by the prototype running on the same phone. but hey, it's a prototype!

- The model nodes notification sound and noise level both are derived by applying logic to the same sensed sensor values, so, sometimes they are both 'sensed' while in effect there was either only a notification sound, or some noise.

- on older android phones switching to the graph takes a while, that's probably because the graph library used uses the HTML5 canvas element which is not that fast on older androids.
