load('api_config.js');
load('api_timer.js');
load('api_gpio.js');
load('api_uart.js');
load('api_sys.js');
load('api_gpio.js');
load('api_blynk.js');
load('api_rpc.js');
load('api_dash.js');

let F_reset = ffi('void mgos_config_reset(int)');

let ping = 0, reset_id, led;
let relayPin = Cfg.get('hardware.relayPin');
let relayStat = Cfg.get('hardware.relayStat'); //initial status of relay

GPIO.setup_output(relayPin, relayStat);

function unlock() {
  GPIO.write(relayPin, 0);
  print('Door lock open');
  Timer.set(Cfg.get('hardware.pulseTm'), 0, function () {
    print('Door lock closed');
    GPIO.write(relayPin, 1);
  }, null);
}

if (relayStat === false) {
  unlock();
  Cfg.set({ hardware: {relayStat: true } });
}

Blynk.setHandler(function (conn, cmd, pin, val, id) {
  if (cmd === 'vr') {
    ping = !ping;
    led = ping;
    led = ping ? 0 : 255;
    Blynk.virtualWrite(conn, 1, led, id);
    Blynk.virtualWrite(conn, 0, ping, id);
  }
  else if (cmd === 'vw' && pin === 5 && val === 1) {
    unlock();
  }
}, null);

RPC.addHandler('Wifi.Unlock', function () {
  unlock();
});

RPC.addHandler('Factory.reset', function () {
  F_reset(9);
  Sys.reboot(0);
});

