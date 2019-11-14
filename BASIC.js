class SyntaxTree {
  constructor(input) {
    this.input = input ? input : "";
    this.pos = 0;
    this.goSubPos = undefined;
    this.ifFalse = false;
    this.tree = {};
    this.scope = {};
    this.debug = false;
    this.results = [];
    this.outputElement = undefined;
    this.functions = {
      abs: c => Math.abs(c),
      asc: c => c.charCodeAt(0),
      atn: c => Math.atan(c),
      chr$: c => String.fromCharCode(c),
      cld: () => this.scope = this.functions,
      cos: c => Math.cos(c),
      deg: c => c * (180 / Math.PI),
      exp: c => Math.E ^ c,
      int: c => Math.floor(c),
      inum: c => Math.round(c),
      len: c => c.length,
      log: c => Math.log(c),
      mid$: (c, a, b) => c.substring(a - 1, a + b - 1),
      mod: (a, b) => a % b
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
            var: r[2].toLowerCase(),
            expr: r[3]
          }
        }),
        run: (t) => {
          this.scope[t.args.var] = this.eval(t.args.expr);
          return { type: "assignment", var: t.args.var, expr: t.args.expr };;
        }
      }, {
        type: "FOR",
        reg: /^(?:\d+ )?FOR (\w) *= *([ 0-9A-Z+\-*\/^]+) TO (?:(.+)(?=STEP)|(.+))(?:STEP (\d))?$/,
        parse: (r) => ({
          command: "FOR",
          args: {
            var: r[1].toLowerCase(),
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
            if (this.scope[t.args.var] >= to) break;
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
        reg: /^(?:\d+ )?IF (.*) THEN (.*)$/,
        parse: (r) => ({
          command: "IF",
          condition: r[1],
          then: r[2]
        }),
        run: (t) => {
          let result = this.eval(t.condition.replace(/></g, "!="));
          if (result) return { type: "IF" };
          else {
            this.ifFalse = true;
          }
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
        type: "END",
        reg: /^(?:\d+ )?END.*$/,
        parse: (r) => ({
          command: "END"
        }),
        run: (t) => ({ type: "end" })
      }
    ];
    if (input) this.create();
  }

  // create the syntax tree
  create() {
    // add standard functions to scope
    this.scope = Object.assign({}, this.functions);
    // split into seperate lines
    this.lines = this.input.split("\n");

    // give all the RegExp's in the array as a new array
    let regs = this.types.map((e) => e.reg);

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

      // find the colons that are not inside strings
      let letters = line.split("");
      let inString = false;
      let locs = [];
      let subLines = [];
      letters.forEach((e, i) => {
        if (e == "\"") inString = inString == false ? true : false;
        else if (e == ":") if (!inString) locs.push(i);
      });

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
        subLine = subLine.trim();
        let words = subLine.split(" ");  // split into words

        let type = this.types.findIndex((e, i) => regs[i].test(subLine));
        if (type >= 0) {
          const r = this.types[type].reg.exec(subLine);
          this.tree[lineNumber].push(this.types[type].parse(r));
        } else {
          throw new ReferenceError("Function not defined (line " + lineNumber + ")");
        }
      });
    });
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
    return this.run(this.pos);
  }

  // run specific line
  run(pos) {
    let results = [];
    this.tree[pos].forEach((subLine) => {
      const type = this.typeNames.indexOf(subLine.command);
      const result = this.types[type].run(subLine, pos);
      if (this.debug) console.log(result);
      results.push(result);
    });
    return results;
  }

  runAll() {
    let r = [{ type: "start" }];
    while (r[0].type != "end") r = t.step();
  }

  eval(str) {
    if (typeof str == "string") str = str.toLowerCase();
    let result = math.evaluate(str, this.scope);
    return typeof result == "object"
      ? new ReferenceError("Variable not found in scope")
      : result;
  }

  print(str) {
    this.results.push(str);
    this.outputElement.innerHTML = this.results.join("<br />");
  }

  reset() {
    this.pos = 0;
    this.tree = {};
    this.scope = {};
    this.results = [];
    return true;
  }
}
