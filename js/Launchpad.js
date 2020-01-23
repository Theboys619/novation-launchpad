const navigator = require("jzz");
const EventEmitter = require("events");
var _t;

var LaunchGrid = [
	[104, 105, 106, 107, 108, 109, 110, 111, 0],
	[81, 82, 83, 84, 85, 86, 87, 88, 89],
	[71, 72, 73, 74, 75, 76, 77, 78, 79],
	[61, 62, 63, 64, 65, 66, 67, 68, 69],
	[51, 52, 53, 54, 55, 56, 57, 58, 59],
	[41, 42, 43, 44, 45, 46, 47, 48, 49],
	[31, 32, 33, 34, 35, 36, 37, 38, 39],
	[21, 22, 23, 24, 25, 26, 27, 28, 29],
	[11, 12, 13, 14, 15, 16, 17, 18, 19]
];

class Launchpad extends EventEmitter {
  constructor(deviceName, sysex) {
    super();
    this.deviceName = deviceName;
    this.output = null;
    this.input = null;
    this.sysex = sysex;
    _t = this;

    this.leds = [];
  }

  getDevice() {
    return navigator.requestMIDIAccess({sysex: _t.sysex}).then(function(access) {
      var inputs, outputs, input, output;

      inputs = Array.from(access.inputs.values());
      outputs = Array.from(access.outputs.values());
      access.onstatechange = _t.StatusChanged;

      for (let i = 0; i < inputs.length; i++) {
        input = inputs[i];
        for (let j = 0; j < outputs.length; j++) {
          output = outputs[j];

          if (input.name === output.name && input.name === _t.deviceName && input.type === 'input' && output.type === 'output') {
            _t.input = input;
            _t.output = output;
            _t.input.onmidimessage = _t.getMIDIMessage;
            _t.emit('DeviceReady');
            return this;
          }
        }
      }

      navigator.close();
      throw new Error(`The device ${_t.deviceName} was not found!`);
    });
  }

  StatusChanged(device) {
    if (device == null) {
      throw new Error(`Cannot call the function StatusChanged!`);
    } else {
      if (device.port.name === this.deviceName && device.port.state === 'disconnected') {
        this.input.onmidimessage = null;
        this.input = null;
        this.output = null;
        this.leds = [];
      }
      _t.emit('StatusChange', device);
    }
  }

  getMIDIMessage(e) {
    let data = e.data;
    let cmd = data[0];
    let key = data[1];
    let velocity = data[2];

    if (e == null) {
      throw new Error('Cannot call the function getMIDIMessage!');
    } else if (cmd == 144 || cmd == 176) {
      if (velocity > 0) {
        _t.emit('KeyDown', key, velocity);
      } else if (velocity == 0 || cmd == 128) {
        _t.emit('KeyUp', key, velocity);
      }
    } else if (cmd == 240 && data[6] == 21 && data[7] == 247) {
      _t.emit('Looped', data);
    } else {
      _t.emit('MidiMessage', e);
    }
  }

  sysexEnabled() {
    return this.sysex;
  }


  LedOn(led, color, g, b) {
    this.leds.push(led);
    if (g) {
      if (!this.sysex) {
        throw new Error(`Sysex is Not Enabled. Cannot use RGB values!`);
      }
      let r = color;

      if (r > 63 || g > 63 || b > 63) {
        throw new Error('A RGB value cannot be greater than 63. Use the values 0-63!');
      } else if (r < 0 || g < 0 || b < 0) {
        throw new Error('A RGB value cannot be less than 0. Use the values 0-63!');
      } else {
        this.output.send([240, 0, 32, 41, 2, 24, 11, led, r, g, b, 247]);
      }
    } else {
      if (led >= 104) {
        this.output.send([176, led, color]);
      } else {
        this.output.send([144, led, color]);
      }
    }
  }

  clearLeds() {
    for (let i in this.leds) {
      if (this.leds[i] >= 104) {
        this.output.send([176, this.leds[i], 0]);
      } else {
        this.output.send([144, this.leds[i], 0]);
      }
    }
    this.leds = [];
  }

  setColumn(column, color) {
		if (this.sysex) {
			if (column > 8 || column < 0) {
				throw new Error(`Column number should be between 0-8! Column number is: ${column}`);
			}
			this.output.send([240, 0, 32, 41, 2, 24, 12, column, color]);
		} else {
			throw new Error("Failed to set Column! Sysex is not Enabled!");
		}
	}

	setRow(row, color) {
		if (this.sysex) {
			if (row > 8 || row < 0) {
				throw new Error(`Row number should be between 0-8! Row number is: ${row}`);
			}
			this.output.send([240, 0, 32, 41, 2, 24, 12, row, color]);
		} else {
			throw new Error("Failed to set Row! Sysex is not Enabled!");
		}
	}

  FlashLed(led, color, flashcolor) {
    this.leds.push(led);
    if (!flashcolor) {
      this.output.send([144, led, 0]);
    } else {
      this.output.send([144, led, flashcolor]);
    }
    this.output.send([145, led, color]);
  }

  LedOff(led) {
    this.output.send([144, led, 0]);
  }

  PulseLed(led, color) {
    this.leds.push(led);
    this.output.send([146, led, color]);
  }

  //(240, 0, 32, 41, 2, 24, 20, <Colour> <Loop> <Text> 247)
  //charCodeAt(0);
  //"Hello World!"
  TextOn(text, color, loop) {
    if (this.sysex) {
      let scroll = [240, 0, 32, 41, 2, 24, 20, color, loop]
      if (!loop) {
        let loop = 0;
      }
      if (loop > 1 || loop < 0) {
        throw new Error(`The loop Value should be either 0 or 1`);
      } else {
        for (let i in text) {
          scroll.push(text[i].charCodeAt(0));
        }
        scroll.push(247);
        this.output.send(scroll);
      }
    } else {
      throw new Error(`Sysex is Not Enabled!`);
    }
  }

  TextOff() {
    if (this.sysex) {
      this.output.send([240, 0, 32, 41, 2, 24, 20, 247]);
    } else {
      throw new Error("Sysex Not Enabled!");
    }
  }

  rectTo(color = 0, x1 = 0, y1 = 0, x2 = 0, y2 = 0) {
		for (let y = y1; y <= y2; y++) {
			for (let x = x1; x <= x2; x++) {
				let led = LaunchGrid[y][x];

				this.LedOn(led, color);
			}
		}
	}

	rect(color = 0, x = 0, y = 0, w = 0, h = 0) {
		for (let i = y; i < y + h; i++) {
			for (let j = x; j < x + w; j++) {
				let led = LaunchGrid[i][j];

				this.LedOn(led, color);
			}
		}
	}

	setLeds(color) {
		if (this.sysex) {
			this.output.send([240, 0, 32, 41, 2, 24, 14, color, 247]);
		} else {
			throw new Error("Failed to set Leds! Sysex is not Enabled!");
		}
	}

	resetLeds() {
		if (this.sysex) {
			this.output.send([240, 0, 32, 41, 2, 24, 14, 0, 247]);
		} else {
			throw new Error("Failed to Reset Leds! Sysex is not Enabled!");
		}
	}

}

module.exports = Launchpad;
