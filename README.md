# Novation Launchpad MK2
This is a module to use in Node.js. As of right now it is not available for Browsers.

## Installation

Install by using: ```npm install novation-launchpad```

## Documentation

Documentation is available at https://theboys619.github.io/novation-launchpadmk2/

### Example Use
```javascript
const nl = require('novation-launchpadmk2');
const launchpad = new nl.Launchpad("Launchpad MK2", true); // Pass a second argument (true or false) to disable/enable sysex.

launchpad.getDevice();
launchpad.on('DeviceReady', function() {
  console.log("Device is Ready!");
});
```
