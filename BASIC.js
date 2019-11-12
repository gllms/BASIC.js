class SyntaxTree {
  constructor(input) {
    this.input = input ? input : "";
    this.pos = 0;
    this.tree = {};
    this.scope = {};
    this.debug = false;
    this.results = [];
    this.outputElement = undefined,
      this.functions = {
        abs: c => Math.abs(c),
        asc: c => c.charCodeAt(0),
        atn: c => Math.atan(c),
        chr$: c => String.fromCharCode(c),
        cld: () => this.scope = this.functions,
        cos: c => Math.cos(c),
        deg: c => c * (180/Math.PI),
        exp: c => Math.E^c,
        int: c => Math.floor(c),
        inum: c => Math.round(c),
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
          return { type: "comment" };
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
          let result = this.eval(t.value).toString();
          this.print(result);
          return { type: "string", value: result };
        }
      },
      {
        type: "LET",
        reg: /^\d+ (LET )?(\w) *= *([\w\d+\-*/^() ]+)$/,
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
        reg: /^\d+ FOR (\w) *= *([ 0-9A-Z+\-*\/^]+) TO (?:(.+)(?=STEP)|(.+))(?:STEP (\d))?$/,
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
          let l = {type: "start"};
          while (true) {
            while (l.type != "next") {
              l = this.step();
            }
            this.scope[t.args.var] += step;
            if (this.scope[t.args.var] >= to) break;
            this.pos = n;
            l = {type: "start"};
          }
          return { type: "loop" };
        }
      }, {
        type: "NEXT",
        reg: /^\d+ NEXT.*$/,
        parse: (r) => ({
          command: "NEXT"
        }),
        run: (t) => ({ type: "next" })
      }, {
        type: "END",
        reg: /^\d+ END.*$/,
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
    if (!this.tree[this.pos]) return { type: "end" };
    return this.run(this.pos);
  }

  // run specific line
  run(pos) {
    const type = this.typeNames.indexOf(this.tree[pos].command);
    const result = this.types[type].run(this.tree[pos], pos);
    if (this.debug) console.log(result);
    return result;
  }

  runAll() {
    let r = { type: "start" };
    while (r.type != "end") r = t.step();
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
    this.scope = {};
    this.results = [];
    return true;
  }
}
