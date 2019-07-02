load('api_config.js');
load('api_timer.js');
load('api_gpio.js');
load('api_uart.js');
load('api_sys.js');
load('api_gpio.js');
load('api_blynk.js');
load('api_rpc.js');
load('api_dash.js');

let ping = 0, reset_id,led;
let relayPin = Cfg.get('hardware.relayPin');
let relayStat = Cfg.get('hardware.relayStat'); //initial status of relay

GPIO.setup_output(relayPin, relayStat);

if (relayStat === false) {
  print('Door lock open');
  Timer.set(Cfg.get('hardware.pulseTm'), 0, function () {
    print('Door lock closed');
    GPIO.write(relayPin, 1);
  }, null);
}


Blynk.setHandler(function (conn, cmd, pin, val, id) {
  if (cmd === 'vr') {
    ping = !ping;
    led = ping;
    led = ping? 0:255;
    Blynk.virtualWrite(conn, 1, led, id);    
    Blynk.virtualWrite(conn, 0, ping, id);
    
  }
  else if (cmd === 'vw' && pin === 5 && val === 1) {
    // using virtual pin 5 to turn on 
    print('Door lock open');
    GPIO.write(relayPin, 0);
    Timer.set(Cfg.get('hardware.pulseTm'), 0, function () {
      print('Door lock closed');
      GPIO.write(relayPin, 1);
    }, null);
  }
}, null);

RPC.addHandler('Unlock', function() {
  GPIO.write(relayPin, 0);
  print('Door lock open');
  Timer.set(Cfg.get('hardware.pulseTm'), 0, function () {
  print('Door lock closed');
  GPIO.write(relayPin, 1);
  }, null);
});