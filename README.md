# Yoake Alarm ⏰

A simple alarm web app that runs in the browser. No build step and no dependencies.

## Features

- Large display of the current time and date
- Add alarms with an optional label
- Turn alarms on and off, and delete them
- A sound and a dialog when an alarm goes off (stop / 5-minute snooze)
- Alarms are saved in the browser's localStorage, so they survive a page reload
- Supports dark mode and smartphone-sized screens

## How to use

Open `index.html` in a browser.

```bash
open index.html
```

Or start a local server:

```bash
python3 -m http.server 8000
```

## Notes

- The alarm only rings while the tab is open.
- Browsers restrict autoplaying audio, so interact with the page at least once (for example, by adding an alarm) to make sure the sound plays.
