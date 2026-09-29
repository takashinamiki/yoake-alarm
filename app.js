const STORAGE_KEY = 'yoake-alarms';
const SNOOZE_MINUTES = 5;

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');

let alarms = load();
let activeAlarm = null;
let lastFiredKey = null;
let audioCtx = null;
let beepTimer = null;

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
  } catch {}
}

function render() {
  const list = $('alarm-list');
  list.innerHTML = '';
  const sorted = [...alarms].sort((a, b) => a.time.localeCompare(b.time));

  for (const alarm of sorted) {
    const li = document.createElement('li');
    li.className = 'alarm-item' + (alarm.enabled ? '' : ' off');

    const info = document.createElement('div');
    info.className = 'alarm-info';
    const time = document.createElement('div');
    time.className = 'alarm-time';
    time.textContent = alarm.time;
    const label = document.createElement('div');
    label.className = 'alarm-label';
    label.textContent = alarm.label || 'アラーム';
    info.append(time, label);

    const toggle = document.createElement('button');
    toggle.className = 'toggle';
    toggle.setAttribute('role', 'switch');
    toggle.setAttribute('aria-checked', String(alarm.enabled));
    toggle.setAttribute('aria-label', `${alarm.time} のオン/オフ`);
    toggle.onclick = () => {
      alarm.enabled = !alarm.enabled;
      save();
      render();
    };

    const del = document.createElement('button');
    del.className = 'delete';
    del.textContent = '✕';
    del.setAttribute('aria-label', `${alarm.time} を削除`);
    del.onclick = () => {
      alarms = alarms.filter((a) => a.id !== alarm.id);
      save();
      render();
    };

    li.append(info, toggle, del);
    list.append(li);
  }

  $('empty').hidden = alarms.length > 0;
}

function tick() {
  const now = new Date();
  const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  $('now-time').textContent = hhmm;
  $('now-date').textContent = now.toLocaleDateString('ja-JP', {
    month: 'long', day: 'numeric', weekday: 'short',
  });

  if (activeAlarm) return;
  const due = alarms.find((a) => a.enabled && a.time === hhmm);
  const key = due && `${due.id}-${now.toDateString()}-${hhmm}`;
  if (due && key !== lastFiredKey) {
    lastFiredKey = key;
    ring(due);
  }
}

function ring(alarm) {
  activeAlarm = alarm;
  $('ringing-time').textContent = alarm.time;
  $('ringing-label').textContent = alarm.label || '';
  $('ringing').hidden = false;
  startBeep();
  document.title = `⏰ ${alarm.time} - Yoake Alarm`;
}

function stopRinging() {
  if (!activeAlarm) return null;
  stopBeep();
  $('ringing').hidden = true;
  document.title = 'Yoake Alarm';
  const alarm = activeAlarm;
  activeAlarm = null;
  // 鳴り終わったスヌーズは一度きりなので自動で片付ける
  if (alarm.snooze) {
    alarms = alarms.filter((a) => a.id !== alarm.id);
    save();
    render();
  }
  return alarm;
}

function startBeep() {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  audioCtx.resume();
  const beep = () => {
    [0, 0.25].forEach((offset) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const t = audioCtx.currentTime + offset;
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  };
  beep();
  beepTimer = setInterval(beep, 1000);
}

function stopBeep() {
  clearInterval(beepTimer);
  beepTimer = null;
}

$('alarm-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const time = $('alarm-time').value;
  if (!time) return;
  alarms.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    time,
    label: $('alarm-label').value.trim(),
    enabled: true,
  });
  save();
  render();
  e.target.reset();
  // ブラウザの自動再生制限を回避するため、ユーザー操作時に音声を有効化しておく
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  audioCtx.resume();
});

$('stop-btn').addEventListener('click', stopRinging);

$('snooze-btn').addEventListener('click', () => {
  const alarm = stopRinging();
  if (!alarm) return;
  const t = new Date(Date.now() + SNOOZE_MINUTES * 60 * 1000);
  alarms.push({
    id: `snooze-${Date.now()}`,
    time: `${pad(t.getHours())}:${pad(t.getMinutes())}`,
    label: `${alarm.label || 'アラーム'}（スヌーズ）`,
    enabled: true,
    snooze: true,
  });
  save();
  render();
});

render();
tick();
setInterval(tick, 1000);
