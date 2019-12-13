class SyntaxTree {
  constructor(input) {
    this.input = input ? input : "";
    this.pos = 0;
    this.cpos = {x: 0, y: 0};
    this.goSubPos = undefined;
    this.ifFalse = false;
    this.tree = {};
    this.scope = {KEY: 0};
    this.debug = false;
    this.results = [];
    this.outputElement = undefined;
    this.screen = [];
    this.canvas = document.getElementById("screen");
    this.ctx = this.canvas.getContext("2d");
    this.background = "#000000";
    this.color = undefined;
    this.isDrawing = false;
    this.functions = {
      ASC: c => c.charCodeAt(0),
      ATN: c => Math.atan(c),
      CHR$: (...c) => c.map((e) => String.fromCharCode(e)).join(""),
      CLD: () => this.scope = Object.assign({KEY: 0}, this.functions),
      DEG: c => c * (180 / Math.PI),
      INT: c => Math.floor(c),
      INUM: c => Math.round(c),
      LEN: c => c.length,
      MID$: (c, a, b) => c.substring(a - 1, a + b - 1)
    };
    this.types = [
      {
        type: "REM",
        reg: /^(?:\d+ )?REM (.*)$/,
        parse: (r) => ({ // without () it would be a code block
          command: "REM",
          value: r[1]
        }),
        run: (t) => {
          return { type: "comment" };
        }
      },
      {
        type: "PRINT",
        reg: /^(?:\d+ )?PR(?:INT)? (.*)$/,
        parse: (r) => ({
          command: "PRINT",
          value: r[1]
        }),
        run: (t) => {
          let result = this.eval(t.value).toString();
          this.print(result);
          return { type: "string", value: result };
        }
      },
      {
        type: "LET",
        reg: /^(?:\d+ )?(LET )?(\w) *= *([\w\d+\-*/^() ]+)$/,
        parse: (r) => ({
          command: "LET",
          args: {
            var: r[2],
            expr: r[3]
          }
        }),
        run: (t) => {
          this.scope[t.args.var] = this.eval(t.args.expr);
          if (t.expr.indexOf("KEY") > -1) this.scope.KEY = 0;
          return { type: "assignment", var: t.args.var, expr: t.args.expr };;
        }
      }, {
        type: "FOR",
        reg: /^(?:\d+ )?FOR (\w) *= *([ 0-9A-Z+\-*\/^]+) TO (?:(.+)(?=STEP)|(.+))(?:STEP (\d))?$/,
        parse: (r) => ({
          command: "FOR",
          args: {
            var: r[1],
            start: r[2],
            to: r[3] ? r[3] : r[4],
            step: r[5] ? r[5] : 1
          }
        }),
        run: (t, n) => {
          this.scope[t.args.var] = this.eval(t.args.start);
          let start = this.eval(t.args.start);
          let to = this.eval(t.args.to);
          let step = this.eval(t.args.step);
          let l = [{ type: "start" }];
          while (true) {
            while (l[0].type != "next") {
              l = this.step();
            }
            this.scope[t.args.var] += step;
            if (this.scope[t.args.var] > to) break;
            this.pos = n;
            l = [{ type: "start" }];
          }
          return { type: "loop" };
        }
      }, {
        type: "NEXT",
        reg: /^(?:\d+ )?NEXT.*$/,
        parse: (r) => ({
          command: "NEXT"
        }),
        run: (t) => ({ type: "next" })
      }, {
        type: "IF",
        reg: /^(?:\d+ )?IF (.*?) THEN (.*)$/,
        parse: (r) => ({
          command: "IF",
          condition: r[1],
          then: this.parse(r[2])
        }),
        run: (t) => {
          let result = this.eval(t.condition.replace(/></g, "!=").replace("=", "=="));
          if (result) {
            this.run(t.then);
          } else {
            this.ifFalse = true;
          }
          if (t.condition.indexOf("KEY") > -1) this.scope.KEY = 0;
          return { type: "IF" };
        }
      }, {
        type: "GOTO",
        reg: /^(?:\d+ )?GOTO (.*)$/,
        parse: (r) => ({
          command: "GOTO",
          line: r[1]
        }),
        run: (t) => {
          this.pos = this.eval(t.line) - 1;
          return { type: "goto", line: t.line };
        }
      }, {
        type: "GOSUB",
        reg: /^(?:\d+ )?GOSUB (.*)$/,
        parse: (r) => ({
          command: "GOSUB",
          line: r[1]
        }),
        run: (t) => {
          this.goSubPos = this.pos;
          this.pos = this.eval(t.line) - 1;
          return { type: "gosub", line: t.line };
        }
      }, {
        type: "RETURN",
        reg: /^(?:\d+ )?RETURN$/,
        parse: (r) => ({
          command: "RETURN"
        }),
        run: (t) => {
          if (this.goSubPos !== undefined) {
            this.pos = this.goSubPos;
          } else {
            throw new SyntaxError("RETURN called without GOSUB");
          }
          return { type: "return" };
        }
      }, {
        type: "CPOS",
        reg: /^(?:\d+ )?CPOS ?\((.+), ?(.+)\)$/,
        parse: (r) => ({
          command: "CPOS",
          pos: {
            x: r[1],
            y: r[2]
          }
        }),
        run: (t) => {
          this.cpos.x = this.eval(t.pos.x);
          this.cpos.y = this.eval(t.pos.y);
          return { type: "cpos" };
        }
      }, {
        type: "CLS",
        reg: /^(?:\d+ )?CLS/,
        parse: (r) => ({
          command: "CLS"
        }),
        run: (t) => {
          this.screen[this.cpos.y].splice(this.cpos.x, 39 - this.cpos.x, ...Array.from({ length: 39 - this.cpos.x }, (e) => ({ char: 0, user: false })));
          this.screen.splice(this.cpos.y + 1, 23 - this.cpos.y, ...Array.from({ length: 23 - this.cpos.y }, (e) => Array.from({ length: 40 }, (e) => ({ char: 0, user: false }))));
          return { type: "cls" };
        }
      }, {
        type: "SHAPE",
        reg: /^(?:\d+ )?SHAPE ?\((\d+), *"(.*)"\)$/,
        parse: (r) => ({
          command: "SHAPE",
          char: r[1],
          hex: r[2]
        }),
        run: (t) => {
          if (t.hex.length == 18) this.editedChars[t.char] = t.hex;
          else throw new SyntaxError("Second argument of SHAPE requires length of 18");
          return { type: "shape" };
        }
      }, {
        type: "SCREEN",
        reg: /^(?:\d+ )?SCREEN ?\((.+)\)$/,
        parse: (r) => ({
          command: "SCREEN",
          color: r[1]
        }),
        run: (t) => {
          this.background = ["#FFFFFF", "#000000", "#00FF00", "#0000FF", "#00FFFF", "#FF0000", "#FFFF00", "#FF00FF", "#FFFFFF"][t.color];
          return { type: "screen" };
        }
      }, {
        type: "COLOR",
        reg: /^(?:\d+ )?COLOR ?\((.+)\)$/,
        parse: (r) => ({
          command: "COLOR",
          color: r[1]
        }),
        run: (t) => {
          this.color = [["#FF00FF", "#FFFFFF"], ["#000000", "#00FF00"], ["#FF0000", "#FFFF00"], ["#0000FF", "#00FFFF"], ["#FF00FF", "#FFFFFF"], ["#000000", "#0000FF"], ["#FF0000", "#FF00FF"], ["#00FF00", "#00FFFF"], ["#FFFF00", "#FFFFFF"], ["#000000", "#FF0000"], ["#0000FF", "#FF00FF"], ["#00FF00", "#FFFF00"], ["#00FFFF", "#FFFFFF"]][t.color];
          return { type: "color" };
        }
      }, {
        type: "END",
        reg: /^(?:\d+ )?END.*$/,
        parse: (r) => ({
          command: "END"
        }),
        run: (t) => ({ type: "end" })
      }
    ];
    this.chars = {
      0: "000000000000000000",
      1: "fed4d4d4d4d4d4c0c0",
      2: "fee2d0c8d0e2fec0c0",
      3: "1e20202020201e0000",
      4: "ffe1e1e1e1e1e1e1ff",
      5: "c0dededededededec0",
      6: "ffc0c0c0c0c0c0c0c0",
      7: "c1c1c1c1c1c1c1c1c1",
      8: "c0c0c0c0c0c0c0c0ff",
      9: "1c08080808081c0000",
      10: "c0c0c0c0c0c0c0c0c0",
      11: "222428302824220000",
      12: "e0e0e0e0e0e0e0e0e0",
      13: "c0c0c0c0c0c0c0c0c0",
      14: "c8c8c8c8fedcc8c0c0",
      15: "c0c8ccfeccc8c0c0c0",
      16: "ffe0e0e0e0e0e0e0e0",
      17: "ffc1c1c1c1c1c1c1c1",
      18: "3c22223c2824220000",
      19: "1c22201c02221c0000",
      20: "e0e0e0e0e0e0e0e0ff",
      21: "ccdeffffffffffdecc",
      22: "c8c8c8c8c8c8c8c8c8",
      23: "cccccccccccccccccc",
      24: "c0c0c0ffffffc0c0c0",
      25: "c0c8d8fed8c8c0c0c0",
      26: "c1c1c1c1c1c1c1c1ff",
      27: "c0c0c0c0c0c0c0c0c0",
      28: "c0c0c0c0c0c0c0c0c0",
      29: "c0c0c0c0c0c0c0c0c0",
      30: "c0c0c0c0c0c0c0c0c0",
      31: "c0c0c0c0c0c0c0c0c0",
      32: "c0c0c0c0c0c0c0c0c0",
      33: "c8c8c8c8c8c0c8c0c0",
      34: "d4d4c0c0c0c0c0c0c0",
      35: "d4d4fed4fed4d4c0c0",
      36: "c8dee8dccafcc8c0c0",
      37: "f2f2c4c8d0e6e6c0c0",
      38: "d0e8e8d0eae4dac0c0",
      39: "c8c8c0c0c0c0c0c0c0",
      40: "c2c4c8c8c8c4c2c0c0",
      41: "e0d0c8c8c8d0e0c0c0",
      42: "c8eadcc8dceac8c0c0",
      43: "c0c8c8fec8c8c0c0c0",
      44: "c0c0c0c0c0c8c8d0c0",
      45: "c0c0c0c0fec0c0c0c0",
      46: "c0c0c0c0c0c0c8c0c0",
      47: "c0c2c4c8d0e0c0c0c0",
      48: "dce2e6eaf2e2dcc0c0",
      49: "c8d8c8c8c8c8dcc0c0",
      50: "dce2e2ccd0e0fec0c0",
      51: "dce2c2ccc2e2dcc0c0",
      52: "c4ccd4e4fec4c4c0c0",
      53: "fee0fcc2c2e2dcc0c0",
      54: "ccd0e0fce2e2dcc0c0",
      55: "fec2c4c8d0d0d0c0c0",
      56: "dce2e2dce2e2dcc0c0",
      57: "dce2e2dec2c4c8c0c0",
      58: "c0c0c8c0c8c0c0c0c0",
      59: "c0c0c8c0c0c8c8d0c0",
      60: "c2c4c8d0c8c4c2c0c0",
      61: "c0c0fec0fec0c0c0c0",
      62: "e0d0c8c4c8d0e0c0c0",
      63: "dce2c4c8c8c0c8c0c0",
      64: "ffffffffffffffffff",
      65: "c8dce2e2fee2e2c0c0",
      66: "fcd2d2dcd2d2fcc0c0",
      67: "dce2e0e0e0e2dcc0c0",
      68: "f8e4e2e2e2e4f8c0c0",
      69: "fee0e0fce0e0fec0c0",
      70: "fee0e0fce0e0e0c0c0",
      71: "dce0e0eee2e2dcc0c0",
      72: "e2e2e2fee2e2e2c0c0",
      73: "dcc8c8c8c8c8dcc0c0",
      74: "cec4c4c4c4e4d8c0c0",
      75: "e2e4e8f0e8e4e2c0c0",
      76: "e0e0e0e0e0e0fec0c0",
      77: "e2f6eaeae2e2e2c0c0",
      78: "e2e2f2eae6e2e2c0c0",
      79: "dce2e2e2e2e2dcc0c0",
      80: "fce2e2fce0e0e0c0c0",
      81: "dce2e2e2eae4dac0c0",
      82: "fce2e2fce8e4e2c0c0",
      83: "dce2e0dcc2e2dcc0c0",
      84: "fec8c8c8c8c8c8c0c0",
      85: "e2e2e2e2e2e2dcc0c0",
      86: "e2e2e2d4d4c8c8c0c0",
      87: "e2e2e2eaeaf6e2c0c0",
      88: "e2e2d4c8d4e2e2c0c0",
      89: "e2e2d4c8c8c8c8c0c0",
      90: "fec2c4c8d0e0fec0c0",
      91: "cec8c8c8c8c8cec0c0",
      92: "c0e0d0c8c4c2c0c0c0",
      93: "dcc4c4c4c4c4dcc0c0",
      94: "c8dcfec8c8c8c8c0c0",
      95: "c0c0c0c0c0c0ffffc0",
      96: "9ca2a6aab2a29c8080",
      97: "8898888888889c8080",
      98: "9ca2a28c90a0be8080",
      99: "9ca2828c82a29c8080",
      100: "848c94a4be84848080",
      101: "bea0bc8282a29c8080",
      102: "8c90a0bca2a29c8080",
      103: "be8284889090908080",
      104: "9ca2a29ca2a29c8080",
      105: "9ca2a29e8284888080",
      106: "9ca2a6aab2a29c8080",
      107: "bfbfbfbfbfbfbfbfbf",
      108: "7f7f7f7f7f7f7f7f7f",
      109: "3f3f3f3f3f3f3f3f3f",
      110: "c8c8dcdcdcf6e2e2c0",
      111: "c0c0c7cfd8cfc0c0c0",
      112: "c0c0c0fff8ffc0c0c0",
      113: "c6cedcfcc8f0c0c0c0",
      114: "c0cccac9c8d8f8f0c0",
      115: "c0c0ccdeffccd2e1c0",
      116: "ffc0ced0d0cec0ffc0",
      117: "ffc0ded2d2dec0ffc0",
      118: "ffc0e2f6eae2c0ffc0",
      119: "ffc0e4d8d8e4c0ffc0",
      120: "808080808080bf8080",
      121: "dee1e0e0e0e0e1dec0",
      122: "9ea1a1a1a1a1a19e80",
      123: "61736d616161616140",
      124: "2121120c0c12212100",
      125: "8080bf808080808080",
      126: "ccd2ede9edd2ccc0c0",
      127: "8080808080808080bf",
      128: "c0c0c0c0c0c0c0c0c0"
    };
    this.editedChars = {};

    if (input) this.create();

    this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.mozRequestPointerLock;
    this.canvas.addEventListener("click", () => this.canvas.requestPointerLock());
    document.addEventListener("keydown", (e) => {
      if (document.pointerLockElement === this.canvas || document.mozPointerLockElement === this.canvas) {
        e.preventDefault();
        this.scope.KEY = e.keyCode;
      }
    });
  }

  // create the syntax tree
  create() {
    // add standard functions to scope
    this.scope = Object.assign({KEY: 0}, this.functions);
    // split into seperate lines
    this.lines = this.input.split("\n");

    // give all the RegExp's in the array as a new array
    this.regs = this.types.map((e) => e.reg);

    // create list of types
    this.typeNames = this.types.map((e) => e.type);

    // loop over each line
    this.lines.forEach(line => {
      line = line.trim();

      let lineNumber = line.split(" ")[0];

      // check if first "word" is a number
      if (!lineNumber.match(/^\d+$/)) {
        throw new SyntaxError("Line must start with numbers (line " + lineNumber + ")");
      }

      let locs = [];
      let subLines = [];

      // find the colons that are not inside strings
      if (!line.match(/^(?:\d+ )?REM (.*)$/)) {
        let letters = line.split("");
        let inString = false;
        letters.forEach((e, i) => {
          if (e == "\"") inString = inString == false ? true : false;
          else if (e == ":") if (!inString) locs.push(i);
        });
      }

      if (locs.length) {
        locs.push(line.length);
        locs.forEach((e, i) => {
          subLines.push(line.slice(locs[i - 1] + (i > 0 ? 1 : 0), e));
        })
      } else {
        subLines.push(line);
      }

      this.tree[lineNumber] = [];

      subLines.forEach((subLine) => {
        let result = this.parse(subLine);
        if (result.type == "error") {
          throw new ReferenceError("Function not defined (line " + lineNumber + ")");
        } else {
          this.tree[lineNumber].push(result);
        }
      });
    });

    this.createScreen();

    if (!this.isDrawing) requestAnimationFrame(() => this.draw()); this.isDrawing = true;
  }

  createScreen() {
    this.screen = Array.from({ length: 24 }, (e) => Array.from({ length: 40 }, (e) => ({ char: 0, user: false })));
  }

  parse(str) {
    str = str.trim();
    let words = str.split(" ");  // split into words

    let type = this.types.findIndex((e, i) => this.regs[i].test(str));
    if (type >= 0) {
      const r = this.types[type].reg.exec(str);
      return this.types[type].parse(r);
    } else {
      return { type: "error" };
    }
  }

  // run next line
  step() {
    this.pos++;
    let dpos = 0;

    // stop trying after 100 tries
    while (!this.tree[this.pos] && dpos < 100) {
      this.pos++;
      dpos++;
    }
    if (!this.tree[this.pos]) return [{ type: "end" }];
    return this.runLine(this.pos);
  }

  // run specific line
  runLine(pos) {
    this.ifFalse = false;
    let results = [];
    this.tree[pos].forEach((subLine) => {
      results.push(this.run(subLine, pos));
    });
    return results;
  }

  run(obj, pos) {
    if (!this.ifFalse) {
      const type = this.typeNames.indexOf(obj.command);
      const result = this.types[type].run(obj, pos);
      if (this.debug) console.log(result);
      return result;
    }
  }

  runAll() {
    let r = [{ type: "start" }];
    let intr = setInterval(() => {
      if (r[0].type == "end") clearInterval(intr);
      r = t.step();
    }, 1000/60);
  }

  parseHex(str) {
    let s = [];
    str.match(/.{2}/g).forEach((e) => s.push(parseInt(e, 16).toString(2).padStart(8, 0)));
    return s;
  }

  eval(str) {
    let result = math.evaluate(str, this.scope);
    return typeof result == "object"
      ? new ReferenceError("Variable not found in scope")
      : result;
  }

  print(str) {
    this.results.push(str);
    this.text(str, false);
    if (this.outputElement) {
      this.outputElement.innerHTML = this.results.join("<br />");
    } else {
      console.log(str);
    }
  }

  text(chars, user) {
    chars.split("").forEach((char) => {
      this.screen[this.cpos.y][this.cpos.x] = {char: char.charCodeAt(0), user: user};
      if (this.cpos.x > 38) this.newline();
      else this.cpos.x++;
    });
    this.newline();
  }

  draw() {
    this.clearScreen();
    let offset = 0;
    this.screen.forEach((line, i) => {
      line.forEach((l, j) => {
        if (l.char == 10) offset++;
        else {
          let hex = this.editedChars[l.char] || this.chars[l.char] || this.chars[63];
          let bin = this.parseHex(hex);
          bin.forEach((e, m) => {
            e = e.split("");
            let color = l.user ? "#FFFFFF" : "#00FFFF";
            let c = e.splice(0, 2);
            if (this.color && !this.editedChars[l.char]) {
              color = l.user ? this.color[1] : this.color[0];
            } else {
              if (c[0] == 0 && c[1] == 0) color = l.user ? "#FF0000" : "#000000";
              else if (c[0] == 0 && c[1] == 1) color = l.user ? "#FF00FF" : "#0000FF";
              else if (c[0] == 1 && c[1] == 0) color = l.user ? "#FFFF00" : "#00FF00";
            }
            this.ctx.fillStyle = color;
            e.forEach((b, n) => {
              if (parseInt(b)) this.ctx.fillRect(j * 6 + n, i * 9 + m, 1, 1);
            });
          });
        }
      });
    });
    requestAnimationFrame(() => this.draw());
  }

  clearScreen() {
    this.ctx.fillStyle = this.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  newline() {
    this.cpos.x = 0;
    if (this.cpos.y < 23) this.cpos.y++
    else {
      this.screen.shift();
      this.screen.push(Array.from({ length: 40 }, (e) => ({ char: 0, user: false })));
      this.clearScreen();
    }
  }

  reset() {
    this.pos = 0;
    this.tree = {};
    this.scope = {KEY: 0};
    this.results = [];
    this.cpos = {x: 0, y: 0};
    this.background = "#000000";
    this.color = undefined;
    this.editedChars = {};
    this.createScreen();
    this.clearScreen();
    return true;
  }
}
