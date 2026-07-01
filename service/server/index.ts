import { createElement } from 'react';
import { render } from 'ink';
import { App } from '@/app/App.js';

const ENTER_ALT_SCREEN = '\x1b[?1049h\x1b[H';
const LEAVE_ALT_SCREEN = '\x1b[?1049l';

process.stdout.write(ENTER_ALT_SCREEN);

const restoreScreen = () => {
  process.stdout.write(LEAVE_ALT_SCREEN);
};

const instance = render(createElement(App), {
  exitOnCtrlC: true,
});

instance.waitUntilExit().finally(restoreScreen);

process.on('exit', restoreScreen);
process.on('SIGINT', () => {
  instance.unmount();
  restoreScreen();
});
process.on('SIGTERM', () => {
  instance.unmount();
  restoreScreen();
});
