load('api_config.js');
load('api_timer.js');
load('api_gpio.js');
load('api_sys.js');
load('api_blynk.js');
load('api_rpc.js');
load('api_dash.js');
load('api_events.js');

let F_reset = ffi('void mgos_config_reset(int)');

let ping = 0, led;
let relayPin = Cfg.get('hardware.relayPin');
let relayStat = Cfg.get('hardware.relayStat'); //initial status of relay
let reset = 0;
let reset_id;
let time;

GPIO.setup_output(relayPin, relayStat);

function unlock() {
  GPIO.write(relayPin, 0);
  let now = Timer.now();
  time = Timer.fmt('%F %T', now);
  print('Door lock open at', time);
  Timer.set(Cfg.get('hardware.pulseTm'), 0, function () {
    print('Door lock closed');
    GPIO.write(relayPin, 1);
  }, null);
}

if (relayStat === false) {
  unlock();
  Cfg.set({ hardware: { relayStat: true } });
}

Blynk.setHandler(function (conn, cmd, pin, val, id) {
  if (cmd === 'vr') {
    ping = !ping;
    led = ping ? 0 : 255;
    Blynk.virtualWrite(conn, 1, led, id);
    Blynk.virtualWrite(conn, 0, ping, id);
  }
  else if (cmd === 'vw' && pin === 5 && val === 1) {
    unlock();
    Blynk.virtualWrite(conn, 4, time, id);
  }
}, null);

RPC.addHandler('Wifi.Unlock', function () {
  unlock();
});

RPC.addHandler('Factory.reset', function () {
  F_reset(9);
  Sys.reboot(0);
});

Event.addHandler(Event.CLOUD_DISCONNECTED, function (ev, evdata, ud) {
  if (reset === 1) {
    reset=reset+1;
    let now = Timer.now();
    let time = Timer.fmt('%F %T', now);
    print("cloud Disconnected,Going to reboot!",time);
    reset_id = Timer.set(300000, 0, function () {
      Sys.reboot(0);
    }, null); 
  }
}, null);

Event.addHandler(Event.CLOUD_CONNECTED, function (ev, evdata, ud) {
  if (reset>0){
  print("cloud connected");
  Timer.del(reset_id);
  }
  reset =1;
}, null);