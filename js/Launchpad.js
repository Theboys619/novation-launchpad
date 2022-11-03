const navigator = require("jzz");
const EventEmitter = require("events");
var _t;

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
    if (g !== undefined) {
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

  setRowLeds(row, color) {
    if (row > 9) {
      throw new Error(`The row ${row} exceeds the limit of 9 Rows!`);
    } else if (row <= 0) {
      throw new Error(`The row ${row} has to be a value greater than 0!`);
    } else if (row == 9) {
      for (let i = 104; i < 112; i++) {
        this.leds.push[i];
        this.LedOn(i, color);
      }
    } else {
      let r = row * 10 + 1;

      for (let i = r; i < r + 9; i++) {
        this.leds.push[i];
        this.LedOn(i, color);
      }
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
      console.log("Sysex Not Enabled!");
    }
  }

}

module.exports = Launchpad;
