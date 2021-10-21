// 处理显示屏

const DISPLAY_WIDTH = 64
const DISPLAY_HEIGHT = 32

export class ChipScreen {

  private frame: Uint8Array

  constructor() {
    this.frame = new Uint8Array(DISPLAY_WIDTH * DISPLAY_HEIGHT)
  }

  public drawPixel(x: number, y: number, value: number) {
    //  If collision, will return true
    const collision = this.frame[x][y] & value
    // XOR value to position x, y
    this.frame[y * DISPLAY_WIDTH + x] ^= value

    return collision
  }

  public clearScreen() {
    this.frame = new Uint8Array(DISPLAY_WIDTH * DISPLAY_HEIGHT)
  }

  public getFramePixel() {
    return this.frame
  }

}
