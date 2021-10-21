import { CHIP8 } from '../src/index';

const input = document.querySelector<HTMLInputElement>('#inputfile');
const canvas = document.querySelector<HTMLCanvasElement>('#screen');
// const log = document.querySelector('#log');
const speed = document.querySelector('#speed');

function run() {
  if (!input) throw new Error('input not found');
  input.onchange = () => {
    const file = (input as any).files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const data = new Uint8Array(reader.result as ArrayBuffer);
      startGame(data);
    };
    reader.readAsArrayBuffer(file);
  };
}

function startGame(data: Uint8Array) {
  const chip8 = new CHIP8();
  (window as any).chip8 = chip8;
  chip8.loadROM(data);
  controller(chip8);

  const up = document.querySelector<HTMLButtonElement>('#up');
  if (up) up.onclick = () => chip8.speedUp();
  const down = document.querySelector<HTMLButtonElement>('#down');
  if (down) down.onclick = () => chip8.speedDown();

  window.requestAnimationFrame(function frame() {
    chip8.cycle();
    render(chip8);
    // if (log) log.innerHTML = `日志：${chip8.logger()}`;
    if (speed) speed.textContent = chip8.speed + '';
    window.requestAnimationFrame(frame);
  });
}

function controller(chip8: CHIP8) {
  document.onkeydown = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyX':
        chip8.pressKey(0);
        break;
      case 'Digit1':
        chip8.pressKey(1);
        break;
      case 'Digit2':
        chip8.pressKey(2);
        break;
      case 'Digit3':
        chip8.pressKey(3);
        break;
      case 'KeyQ':
        chip8.pressKey(4);
        break;
      case 'KeyW':
        chip8.pressKey(5);
        break;
      case 'KeyE':
        chip8.pressKey(6);
        break;
      case 'KeyA':
        chip8.pressKey(7);
        break;
      case 'KeyS':
        chip8.pressKey(8);
        break;
      case 'KeyD':
        chip8.pressKey(9);
        break;
      case 'KeyZ':
        chip8.pressKey(10);
        break;
      case 'KeyC':
        chip8.pressKey(11);
        break;
      case 'Digit4':
        chip8.pressKey(12);
        break;
      case 'KeyR':
        chip8.pressKey(13);
        break;
      case 'KeyF':
        chip8.pressKey(14);
        break;
      case 'KeyV':
        chip8.pressKey(15);
        break;
    }
  };
  document.onkeyup = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyX':
        chip8.releaseKey(0);
        break;
      case 'Digit1':
        chip8.releaseKey(1);
        break;
      case 'Digit2':
        chip8.releaseKey(2);
        break;
      case 'Digit3':
        chip8.releaseKey(3);
        break;
      case 'KeyQ':
        chip8.releaseKey(4);
        break;
      case 'KeyW':
        chip8.releaseKey(5);
        break;
      case 'KeyE':
        chip8.releaseKey(6);
        break;
      case 'KeyA':
        chip8.releaseKey(7);
        break;
      case 'KeyS':
        chip8.releaseKey(8);
        break;
      case 'KeyD':
        chip8.releaseKey(9);
        break;
      case 'KeyZ':
        chip8.releaseKey(10);
        break;
      case 'KeyC':
        chip8.releaseKey(11);
        break;
      case 'Digit4':
        chip8.releaseKey(12);
        break;
      case 'KeyR':
        chip8.releaseKey(13);
        break;
      case 'KeyF':
        chip8.releaseKey(14);
        break;
      case 'KeyV':
        chip8.releaseKey(15);
        break;
    }
  };
}

let ctx: CanvasRenderingContext2D;
let imageData: ImageData;
const SIZE = 4;
const DISPLAY_HEIGHT = 32;
const DISPLAY_WIDTH = 64;
const width = DISPLAY_WIDTH * SIZE;
const height = DISPLAY_HEIGHT * SIZE;

function render(chip8: CHIP8) {
  if (!ctx) {
    if (!canvas) return;
    const p = canvas.getContext('2d');
    if (!p) return;
    ctx = p;
    imageData = ctx.getImageData(0, 0, width, height);
  }
  const pixels = chip8.getFramePixel();
  const buf8Dst = new Uint8ClampedArray(width * height * 4);
  let i = 0;
  while (i < pixels.length) {
    const pos = SIZE * SIZE * i - (SIZE * SIZE - SIZE) * (i % DISPLAY_WIDTH);

    for (let x = 0; x < SIZE; x++) { 
      for (let y = 0; y < SIZE; y++) {
        const base = (pos + width * x + y) * 4;

        const val = pixels[i] > 0 ? 0 : 255;
        buf8Dst[base] = val;
        buf8Dst[base + 1] = val;
        buf8Dst[base + 2] = val;
        buf8Dst[base + 3] = 255;
      }
    }
    i++;
  }

  imageData.data.set(buf8Dst);
  ctx.putImageData(imageData, 0, 0);

  // 这里是第二种渲染方式
  // ctx.fillStyle = 'white'
  // ctx.fillRect(0, 0, width, height)
  // for (let x = 0; x < arr.length; x ++) {
  //   const column = arr[x]
  //   for (let y = 0; y < column.length; y++) {
  //     if (arr[x][y]) {
  //       ctx.fillStyle = 'black'
  //       ctx.fillRect(
  //         x * SIZE,
  //         y * SIZE,
  //         SIZE,
  //         SIZE
  //       )
  //     } else {
  //       ctx.fillStyle = 'white'
  //       ctx.fillRect(
  //         x * SIZE,
  //         y * SIZE,
  //         SIZE,
  //         SIZE
  //       )
  //     }
  //   }
  // }
}

run();
