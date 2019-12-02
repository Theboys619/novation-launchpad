# Documentation

## Table Of Contents

- [Listeners](#listeners)
- [Functions](#functions)
- [Examples](#examples)
	- [Listener Examples](#listener-examples)
	- [Function Examples](#function-examples)

## Listeners
- **Looped**
	- No Arguments
	- Listens for text scrolling to have looped (Sends Every Loop)
- **KeyDown**
	- Arguments: `note, velocity`
	- Listens for a button pressed on Launchpad
- **KeyUp**
	- Arguments: `note, veloctiy`
    	- Listens after a button is pushed and let off on Launchpad
- **MidiMessage**
	- Arguments: `e or event`
	- Listens for any message of Launchpad
- **DeviceReady**
	- No Arguments
	- Listens for when the Launchpad is ready to use
- **StatusChange**
	- Arguments: `device`
	- Listens for a change in the device

## Functions
- **getDevice**
	- No Arguments
	- Gets device specified and emits "DeviceReady" once ready
- **LedOff**
	- Arguments: `led`
	- Turns a specified led off
- **LedOn**
	- Arguments: `led, color, g, b`
	- Sets an Led with a specific velocity value or color (RGB).
	- Color argument is also red and RGB is not required
	- RGB values only go from 0-63 (64 values)
	- Color value if no g or b specified must be 0-127
- **clearLeds**
	- No Arguments
	- Clears all led that were turned on
- **FlashLed**
	- Arguments: `led, flashingcolor, startingcolor`
	- Sets and Led to the starting color and flashes between the flashing color and the starting color
- **PulseLed**
	- Arguments: `led, color`
	- Pulses the led with a color (Turns brightness up and down)
- **setRowLeds**
	- Arguments: `row, color`
	- Sets an entire row of leds to light up
	- The row must be between 0 and 9 (1-8)
- **TextOn**
	- Arguments: `text, color, loop`
	- Scrolls text with a color on the launchpad and loops if loop is 1
	- Text must be a string
- **TextOff**
	- No Arguments
	- Stops text from scrolling on screen if it is looping
- **sysexEnabled**
	- No Arguments
	- Returns true or false if sysex is enbaled or not
## Examples

### Listener Examples
```javascript
const nl = require('novation-launchpadmk2');
const launchpad = new nl.Launchpad("Launchpad MK2"); // Pass a second argument (true or false) to enable sysex
let counter = 0;

launchpad.getDevice();

// Arrow functions also work
launchpad.on('DeviceReady', function() {
	console.log("Device Ready!");
});

launchpad.on('KeyUp', function(note, vel) {
	console.log(`NoteOff: ${note} with Velocity ${vel}`);
});
launchpad.on('KeyDown', function(note, vel) {
	console.log(`NoteOff: ${note} with Velocity ${vel}`);
});

launchpad.on('Looped', function() {
	counter++;
	console.log(`The text has looped ${counter} times`);
});

launchpad.on('StatusChange', function(device) {
	console.log(`Device: ${device.port.name} ${device.port.state}`);
});
```

### Function Examples
```javascript
const nl = require('novation-launchpadmk2');
const launchpad = new nl.Launchpad("Launchpad MK2"); // Pass a second argument (true or false) to enable sysex

launchpad.getDevice(); // Gets the Device Specified and emits "DeviceReady" once ready
launchpad.on("DeviceReady", function() {
	console.log("Device is Ready!");
	console.log("Sysex: " + launchpad.sysexEnabled()); // Returns to console if sysex is enabled

	launchpad.FlashLed(111, 5, 2); // Flashes red and white once device is ready at button 111
	launchpad.PulseLed(89, 5); // Pulses red at the top farthest led (89)
});

// Paints leds red when pressed
launchpad.on("KeyDown", function(note, vel) {
	launchpad.LedOn(note, 5); // ...LedOn(note, 63, 0, 0) also works only if sysex is enabled

	switch (note) { // switch statement for different note values (button pressed)
		case 19:
			launchpad.clearLeds(); // Clears all lit leds if Record/Arm pressed
			// Loops through all leds that are on and uses ...LedOff(led)
			break;
		case 111:
			launchpad.TextOn("Hello World!", 5, 1); // Scrolls and loops Hello World! with color red.
			break;
		case 110:
			launchpad.TextOff() // Stops the looping text
			break;
		case 29:
			launchpad.setRowLeds(2, 70); // Sets row 2 leds all to a blue/cyan color
			break;
	}
});
```
