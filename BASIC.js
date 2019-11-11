class SyntaxTree {
  constructor(input) {
    this.input = input ? input : "";
    this.pos = 0;
    this.tree = {};
    this.scope = {};
    this.results = [];
    this.outputElement = undefined,
    this.functions = {
      CHR$: c => String.fromCharCode(c),
      CLD: () => this.scope = this.functions,
      INT: c => Math.floor(c),
      INUM: c => Math.round(c)
    }
    this.types = [
      {
        type: "REM",
        reg: /^\d+ REM (.*)$/,
        parse: (r) => ({ // without () it would be a code block
          command: "REM",
          value: r[1]
        }),
        run: (t) => {
          return 1;
        }
      },
      {
        type: "PRINT",
        reg: /^\d+ PRINT (.*)$/,
        parse: (r) => ({
          command: "PRINT",
          value: r[1]
        }),
        run: (t) => {
          this.results.push(this.eval(t.value).toString());
          return {type: "string", value: this.eval(t.value).toString()};
        }
      },
      {
        type: "LET",
        reg: /^\d+ (LET )?(\w) *= *([\w\d+\-*/() ]+)$/,
        parse: (r) => ({
          command: "LET",
          args: {
            var: r[2],
            expr: r[3]
          }
        }),
        run: (t) => {
          this.scope[t.args.var] = this.eval(t.args.expr);
          return 1;
        }
      }, {
        type: "FOR",
        reg: /^\d+ FOR (\w) *= *([ 0-9A-Z+\-*\/^]+) TO (?:(.+)(?=STEP)|(.+))(?:STEP (\d))?$/,
        parse: (r) => ({
          command: "FOR",
          args: {
            var: r[1],
            start: r[2],
            to: r[3] ? r[3] : r[4],
            step: r[5] ? r[5] : 1
          }
        }),
        run: (t) => {
          this.scope[t.args.var] = this.eval(t.args.start);
          let start = this.eval(t.args.start);
          let to = this.eval(t.args.to);
          let step = this.eval(t.args.step);
          for (let i = this.scope[t.args.var]; i <= to; i += step) {
            console.log(this.scope[t.args.var]);
            this.scope[t.args.var] += step;
          }
          return 1;
        }
      }, {
        type: "END",
        reg: /^\d+ END.*$/,
        parse: (r) => ({
          command: "END"
        }),
        run: (t) => 0
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
      let words = line.split(" ");  // split into words
      let lineNumber = words[0];

      // check if first "word" is a number
      if (!lineNumber.match(/^\d+$/)) {
        throw new SyntaxError("Line must start with numbers (line " + lineNumber + ")");
      }

      // TODO: check against types array
      let type = this.types.findIndex((e, i) => regs[i].test(line));
      if (type >= 0) {
        const r = this.types[type].reg.exec(line);
        this.tree[lineNumber] = this.types[type].parse(r);
      } else {
        throw new ReferenceError("Function not defined (line " + lineNumber + ")");
      }
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
    if (!this.tree[this.pos]) return {type: "END"};
    return this.run(this.pos);
  }

  // run specific line
  run(pos) {
    const type = this.typeNames.indexOf(this.tree[pos].command);
    const result = this.types[type].run(this.tree[pos]);
    if (typeof result == "object" && this.outputElement) {
      this.outputElement.innerHTML = this.results.join("<br />");
    }
    return result;
  }

  runAll() {
    let r = 1;
    while (r > 0) r = t.step();
  }

  eval(str) {
    let result = math.evaluate(str, this.scope);
    return typeof result == "object"
      ? new ReferenceError("Variable not found in scope")
      : result;
  }

  reset() {
    this.pos = 0;
    this.scope = {};
    this.results = [];
    return true;
  }
}
