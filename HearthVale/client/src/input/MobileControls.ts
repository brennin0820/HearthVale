import { Capacitor } from '@capacitor/core';
import './mobile-controls.css';

interface KeyBinding {
  code: string;
  key: string;
  keyCode: number;
}

interface ControlDefinition extends KeyBinding {
  className?: string;
  label: string;
  title: string;
}

const MOVE_CONTROLS: ControlDefinition[] = [
  { code: 'KeyW', key: 'w', keyCode: 87, label: '▲', title: 'Move up', className: 'up' },
  { code: 'KeyA', key: 'a', keyCode: 65, label: '◀', title: 'Move left', className: 'left' },
  { code: 'KeyS', key: 's', keyCode: 83, label: '▼', title: 'Move down', className: 'down' },
  { code: 'KeyD', key: 'd', keyCode: 68, label: '▶', title: 'Move right', className: 'right' },
];

const ACTION_CONTROLS: ControlDefinition[] = [
  { code: 'Digit1', key: '1', keyCode: 49, label: '1', title: 'Use skill 1' },
  { code: 'Digit2', key: '2', keyCode: 50, label: '2', title: 'Use skill 2' },
  { code: 'Digit3', key: '3', keyCode: 51, label: '3', title: 'Use skill 3' },
  { code: 'Digit4', key: '4', keyCode: 52, label: '4', title: 'Use skill 4' },
  { code: 'KeyE', key: 'e', keyCode: 69, label: 'Talk', title: 'Talk or interact', className: 'interact' },
  { code: 'Space', key: ' ', keyCode: 32, label: 'Attack', title: 'Attack', className: 'attack' },
  { code: 'ShiftLeft', key: 'Shift', keyCode: 16, label: 'Brace', title: 'Hold to brace', className: 'brace' },
  { code: 'KeyM', key: 'm', keyCode: 77, label: 'Map', title: 'Toggle local map', className: 'map' },
];

function dispatchKey(type: 'keydown' | 'keyup', binding: KeyBinding): void {
  const event = new KeyboardEvent(type, {
    bubbles: true,
    cancelable: true,
    code: binding.code,
    key: binding.key,
  });

  // Phaser's keyboard manager uses the legacy numeric fields internally.
  Object.defineProperties(event, {
    keyCode: { get: () => binding.keyCode },
    which: { get: () => binding.keyCode },
  });
  window.dispatchEvent(event);
}

function controlButton(control: ControlDefinition): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `hv-touch__button${control.className ? ` hv-touch__button--${control.className}` : ''}`;
  button.textContent = control.label;
  button.setAttribute('aria-label', control.title);

  const activePointers = new Set<number>();
  const press = (event: PointerEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    if (activePointers.has(event.pointerId)) return;
    activePointers.add(event.pointerId);
    button.classList.add('is-pressed');
    button.setPointerCapture(event.pointerId);
    dispatchKey('keydown', control);
  };
  const release = (event: PointerEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    if (!activePointers.delete(event.pointerId)) return;
    if (activePointers.size === 0) {
      button.classList.remove('is-pressed');
      dispatchKey('keyup', control);
    }
  };

  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
  button.addEventListener('contextmenu', (event) => event.preventDefault());
  return button;
}

function controlGroup(className: string, controls: ControlDefinition[]): HTMLElement {
  const group = document.createElement('div');
  group.className = className;
  controls.forEach((control) => group.append(controlButton(control)));
  return group;
}

export function mountMobileControls(): void {
  const isNative = Capacitor.isNativePlatform();
  const hasTouch = window.matchMedia('(pointer: coarse)').matches;
  const isIOSWebView = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (!isNative && !hasTouch && !isIOSWebView) return;

  document.documentElement.classList.add('hv-touch-enabled');
  if (isNative || isIOSWebView) document.documentElement.classList.add('hv-native');

  const controls = document.createElement('div');
  controls.id = 'mobile-controls';
  controls.className = 'hv-touch';
  controls.setAttribute('aria-label', 'Game controls');
  controls.append(
    controlGroup('hv-touch__movement', MOVE_CONTROLS),
    controlGroup('hv-touch__actions', ACTION_CONTROLS),
  );
  document.body.append(controls);
}
