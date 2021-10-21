import { Control } from "./control"
import { FONT_SET } from "./fontSet"
import { ChipScreen } from './screen'

const DISPLAY_WIDTH = 64
const DISPLAY_HEIGHT = 32

export class CHIP8 {
  private ram: Uint8Array
  
  private stack: Uint16Array

  private screen: ChipScreen

  // registers
  private V = Array.from({ length: 16 }, () => 0)
  private PC = 0x200
  private SP = -1
  private I = 0

  // DT is the delay timer register. It is set to a time (in ns) in the
	// future and compared against the current time.
  private DT: number = 0

	// ST is the sound timer register. It is set to a time (in ns) in the
	// future and compared against the current time.
	private ST: number = 0

  public paused: boolean = false

  public soundEnabled: boolean = false

  public speed: number = 1

  public speedUp = () => {
    if (this.speed < 5) this.speed++
  }

  public speedDown = () => {
    if (this.speed > 1) this.speed--
  }

  /* @ts-ignore */
  private timer = 0

  private ctrl: Control

  private reset() {
    // 4096 -- 4k
    this.ram = new Uint8Array(4096)
    this.stack = new Uint16Array(16)
    this.V = Array.from({ length: 16 }, () => 0)
    this.PC = 0x200
    this.SP = -1
    this.I = 0
    this.DT = 0
    this.ST = 0
    this.paused = false
    this.soundEnabled = false
    this.screen = new ChipScreen()
    
    this.ctrl = new Control()
  }

  constructor() {
    this.reset()
  }

  public loadROM(data: Uint8Array) {
    this.reset()
    
    // 0-80 in memory is reserved for font set
    for (let i = 0; i < FONT_SET.length; i++) {
      this.ram[i] = FONT_SET[i]
    }

    const start = 0x200
    this.ram.set(data, start)
  }

  // 渲染不够流程 考虑降低到30fps
  public cycle() {
    this.timer++
    
    if (this.timer % this.speed === 0) {
      this.tick()
    }
  
    if (!this.paused) {
      this.step()
      this.timer = 0
    }
  }

  public pressKey(key: number) {
    if (key < 16) {
      this.ctrl.setOneKey(key)
    }
  }

  public releaseKey(key: number) {
    if (key < 16) this.ctrl.resetKey()
  }

  public getFramePixel(): Uint8Array {
    return this.screen.getFramePixel()
  }

  public hasSound(): boolean {
    return this.ST > 0
  }

  public logger() {
    return `V: ${this.V.join('、')} PC: ${this.PC} SP: ${this.SP} I: ${this.I} ST: ${this.ST}`
  }

  private nextInst(): number {
    this.PC += 2
    return this.PC
  }

  private skipNextInst(): number {
    this.PC += 4
    return this.PC
  }

  private fetch() {
    // 指令是16-bit
    const inst = (this.ram[this.PC] << 8) | this.ram[this.PC+1]
    return inst
  }

  private tick() {
    if (this.DT > 0) {
      this.DT--
    }

    if (this.ST > 0) {
      this.ST--
    } else {
      // When ST reaches zero, the sound timer deactivates.
      if (this.soundEnabled) {
        this.soundEnabled = false
      }
    }
  }

  private step() {
    const inst = this.fetch()

    // 12-bit 
    const a = inst & 0xfff
    // byte
    const b = inst & 0xff
    // nibble 半字节
    const n = inst & 0xf

    // Vx
    const x = (inst >> 8) & 0xf
    // Vy
    const y = (inst >> 4) & 0xf

    if (inst == 0x00E0) {
      this.cls()
    } else if (inst == 0x00EE) {
      this.ret()
    } else if ((inst & 0xf000) == 0) {
      this.sys(a)
    } else if ((inst & 0xf000) == 0x1000) {
      this.jump(a)
    } else if ((inst & 0xf000) == 0x2000) {
      this.callAddr(a)
    } else if ((inst & 0xf000) == 0x3000) {
      this.skipIf(x, b)
    } else if ((inst & 0xf000) == 0x4000) {
      this.skipIfNot(x, b)
    } else if ((inst & 0xf000) == 0x5000) {
      this.skipIfXY(x, y)
    } else if ((inst & 0xf000) == 0x6000) {
      this.storeX(x, b)
    } else if ((inst & 0xf000) == 0x7000) {
      this.addX(x, b)
    } else if ((inst & 0xf00f) == 0x8000) {
      this.storeXY(x, y)
    } else if ((inst & 0xf00f) == 0x8001) {
      this.setXORY(x, y)
    } else if ((inst & 0xf00f) == 0x8002) {
      this.setXANDY(x, y)
    } else if ((inst & 0xf00f) == 0x8003) {
      this.setXXORY(x, y)
    } else if ((inst & 0xf00f) == 0x8004) {
      this.addXY(x, y)
    } else if ((inst & 0xf00f) == 0x8005) {
      this.subXY(x, y)
    } else if ((inst & 0xf00f) == 0x8006) {
      this.shr(x)
    } else if ((inst & 0xf00f) == 0x8007) {
      this.subn(x, y)
    } else if ((inst & 0xf00f) == 0x800e) {
      this.shl(x)
    } else if ((inst & 0xf000) == 0x9000) {
      this.sne(x, y)
    } else if ((inst & 0xf000) == 0xa000) {
      this.ld(a)
    } else if ((inst & 0xf000) == 0xb000) {
      this.jump0(a)
    } else if ((inst & 0xf000) == 0xc000) {
      this.rnd(x, b)
    } else if ((inst & 0xf000) == 0xd000) {
      this.drw(x, y, n)
    } else if ((inst & 0xf0ff) == 0xe09e) {
      this.skipIfPress(x)
    } else if ((inst & 0xf0ff) == 0xe0a1) {
      this.skipIfNotPress(x)
    } else if ((inst & 0xf0ff) == 0xf007) {
      this.storeDT(x)
    } else if ((inst & 0xf0ff) == 0xf00a) {
      this.loadXK(x)
    } else if ((inst & 0xf0ff) == 0xf015) {
      this.setDT(x)
    } else if ((inst & 0xf0ff) == 0xf018) {
      this.setST(x)
    } else if ((inst & 0xf0ff) == 0xf01e) {
      this.setI(x)
    } else if ((inst & 0xf0ff) == 0xf029) {
      this.loadF(x)
    } else if ((inst & 0xf0ff) == 0xf033) {
      this.bcd(x)
    } else if ((inst & 0xf0ff) == 0xf055) {
      this.saveRegs(x)
    } else if ((inst & 0xf0ff) == 0xf065) {
      this.loadRegs(x)
    } else {
      throw new Error('Unknown Instruction.')
    }
  }

  // 00e0 - Clear the display
  private cls() {
    // 0xf00 ~ 0xfff 屏幕部分
    // 64x32-pixel
    this.screen.clearScreen()
    this.nextInst()
  }

  // 00ee - return from subroutine
  private ret() {
    // The interpreter sets the program counter to the address at the top of the stack, then subtracts 1 from the stack pointer.
    if (this.SP == -1) {
      this.paused = true
      throw new Error('SP == -1')
    }

    this.PC = this.stack[this.SP]
    this.SP--
  }

  // 0nnn
  private sys(a: number) {
    // Jump to a machine code routine at nnn.
    // throw new Error('SYS calls are unimplemented')
    this.PC = a
  }

  // 1nnn - jump to location nnn
  private jump(addr: number) {
    this.PC = addr & 0xffff
  }

  // 2nnn - call subroutine at nnn
  private callAddr(addr: number) {
    if (this.SP === 15) {
      this.paused = true
      throw new Error('Stck overflow')
    }
    this.SP++
    this.stack[this.SP] = this.PC + 2
    this.PC = addr
  }

  // 3xnn - Skip next instruction if Vx = nn
  private skipIf(x: number, b: number) {
    if (this.V[x] === b) {
      this.skipNextInst()
    } else {
      this.nextInst()
    }
  }

  // 4xnn - Skip next instruction if Vx != nn
  private skipIfNot(x: number, b: number) {
    if (this.V[x] !== b) {
      this.skipNextInst()
    } else {
      this.nextInst()
    }
  }

  // 5xy0 - Skip next instruction if Vx = Vy
  private skipIfXY(x: number, y: number) {
    if (this.V[x] === this.V[y]) {
      this.skipNextInst()
    } else {
      this.nextInst()
    }
  }

  // 6xnn - Set Vx = nn
  private storeX(x: number, b: number) {
    this.V[x] = b
    this.nextInst()
  }

  // 7xnn - Set Vx = Vx + nn
  private addX(x: number, b: number) {
    this.V[x] += b
    this.nextInst()
  }

  // 8xy0 - Set Vx = Vy
  private storeXY(x: number, y: number) {
    this.V[x] = this.V[y]
    this.nextInst()
  }

  // 8xy1 - Set Vx = Vx OR Vy
  private setXORY(x: number, y: number) {
    this.V[x] =  this.V[x] | this.V[y]
    this.nextInst()
  }

  // 8xy2 - Set Vx = Vx AND Vy
  private setXANDY(x: number, y: number) {
    this.V[x] =  this.V[x] & this.V[y]
    this.nextInst()
  }

  // 8xy3 - Set Vx = Vx XOR Vy
  private setXXORY(x: number, y: number) {
    this.V[x] =  this.V[x] ^ this.V[y]
    this.nextInst()
  }

  // 8xy4 - Set Vx = Vx + Vy, set VF = carry
  private addXY(x: number, y: number) {
    const carry = this.V[x] + this.V[y] > 0xff
    this.V[x] = (this.V[x] + this.V[y]) & 0xff
    this.V[0xf] = carry ? 1 : 0
    this.nextInst()
  }

  // 8xy5 - Set Vx = Vx - Vy, set VF = NOT borrow
  private subXY(x: number, y: number) {
    this.V[0xf] = this.V[x] > this.V[y] ? 1 : 0
    this.V[x] -= this.V[y]
    this.nextInst()
  }

  // 8xy6 - Set Vx = Vx SHR 1
  private shr(x: number) {
    this.V[0xf] = this.V[x] & 1
    this.V[x] >>= 1
    this.nextInst()
  }

  // 8xy7 - Set Vx = Vy - Vx, set VF = NOT borrow
  private subn(x: number, y: number) {
    this.V[0xf] = this.V[x] < this.V[y] ? 1 : 0
    this.V[x] = this.V[y] - this.V[x]
    this.nextInst()
  }

  // 8xye - Set Vx = Vx SHL 1
  private shl(x: number) {
    this.V[0xf] = this.V[x] >> 7
    this.V[x] <<= 1
    this.nextInst()
  }

  // 9xy0 - Skip next instruction if Vx != Vy
  private sne(x: number, y: number) {
    if (this.V[x] !== this.V[y]) {
      this.skipNextInst()
    } else {
      this.nextInst()
    }
  }

  // annn - Set I = nnn
  private ld(a: number) {
    this.I = a
    this.nextInst()
  }

  // bnnn - Jump to location nnn + V0
  private jump0(a: number) {
    this.PC = this.V[0] + a
  }

  // cxnn - Set Vx = random byte AND nn
  private rnd(x: number, b: number) {
    const n = Math.floor(Math.random() * 0xff)
    this.V[x] = n & b
    this.nextInst()
  }

  // dxyn
  // Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.
  private drw(x: number, y: number, n: number) {
    if (this.I > 4095 - n) {
      this.paused = true
      throw new Error('Memory out of bounds.')
    }
    this.V[0xf] = 0
    for (let i = 0; i < n; i++) {
      let line = this.ram[this.I + i]
      // Each byte is a line of eight pixels
      for (let p = 0; p < 8; p++) {
        // Get the byte to set by position
        let value = line & (1 << (7 - p)) ? 1 : 0
        // If this causes any pixels to be erased, VF is set to 1
        let zx = (this.V[x] + p) % DISPLAY_WIDTH // wrap around width
        let zy = (this.V[y] + i) % DISPLAY_HEIGHT // wrap around height

        const collision = this.screen.drawPixel(zx, zy, value)
        if (collision) this.V[0xf] = 1
      }
    }

    this.nextInst()
  }

  // ex9e - Skip next instruction if key with the value of Vx is pressed
  private skipIfPress(x: number) {
    const keyPressed = this.ctrl.checkOneKey(this.V[x])
    if (keyPressed) {
      this.skipNextInst()
    } else {
      this.nextInst()
    }
  }

  // exa1 - Skip next instruction if key with the value of Vx is not pressed
  private skipIfNotPress(x: number) {
    const keyPressed = this.ctrl.checkOneKey(this.V[x])
    if (!keyPressed) {
      this.skipNextInst()
    } else {
      this.nextInst()
    }
  }

  // fx07
  private storeDT(x: number) {
    this.V[x] = this.DT
    this.nextInst()
  }

  // fx0a -  Wait for a key press, store the value of the key in Vx
  private loadXK(x: number) {
 
    const keyPress = this.ctrl.waitKey()
    if (!keyPress) return

    this.V[x] = keyPress
    this.nextInst()
  }

  // fx15 - Set delay timer = Vx
  private setDT(x: number) {
    this.DT = this.V[x]
    this.nextInst()
  }

  // fx18 - Set sound timer = Vx
  private setST(x: number) {
    this.ST = this.V[x]
    if (this.ST > 0) {
      this.soundEnabled = true
    }
    this.nextInst()
  }

  // fx1e - Set I = I + Vx
  private setI(x: number) {
    this.I += this.V[x]
    this.nextInst()
  }

  // fx29 - Set I = location of sprite for digit Vx
  // Load font sprite for vx into I.
  private loadF(x: number) {
    if (this.V[x] > 0xf) {
      this.paused = true
      throw new Error('Invalid digit.')
    }
    this.I = this.V[x] * 5
    this.nextInst()
  }

  // fx33
  // Load address with 8-bit, BCD of vx.
  private bcd(x: number) {
    if (this.I > 4093) {
      this.paused = true
      throw new Error('Memory out of bounds.')
    }
    const vx = this.V[x] 
    const p2 = Math.floor((vx & 0xfff) / 100)
    const p1 = Math.floor((vx & 0xff) / 10)
    const p0 = Math.floor(vx & 0xf)
    
    this.ram[this.I] = p2
    this.ram[this.I+1] = p1
    this.ram[this.I+2] = p0

    this.nextInst()
  }

  // fx55
  // Store registers V0 through Vx in memory starting at location I.
  private saveRegs(x: number) { 
    if (this.I > 4095 - x) {
      this.paused = true
      throw new Error('Memory out of bounds.')
    }
    for (let b = 0; b <= x; b ++) {
      this.ram[this.I + b] = this.V[b]
    }

    this.nextInst()
  }

  // fx65 - Read registers V0 through Vx from memory starting at location I
  private loadRegs(x: number) {
    if (this.I > 4095 - x) {
      this.paused = true
      throw new Error('Memory out of bounds.')
    }
    for (let b = 0; b <= x; b ++) {
      this.V[b] = this.ram[this.I + b]
    }

    this.nextInst()
  }

}
