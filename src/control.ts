// 处理键盘内容，使用位运算提高计算速度
export class Control {

  // 0x0000 每个bit对应一个键盘
  private key: number
  // 上次按下的按钮index
  private keyPressed: number

  constructor() {
    this.resetKey()
  }

  public resetKey() {
    this.key = 0
    this.keyPressed = -1
  }

  public getKey() {
    return this.key
  }

  public checkOneKey(index: number) {
    return (this.key & 1 << index) > 0
  }

  public setOneKey(index: number) {
    this.keyPressed = index
    this.key |= (1 << index)
  }

  public waitKey() {
    const before = this.keyPressed
    this.keyPressed = -1
    return before
  }
}
