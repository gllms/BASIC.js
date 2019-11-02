class SyntaxTree {
  constructor(input) {
    this.input = input ? input : "";
    this.pos = 0;
    this.tree = {};
    this.scope = {};
    this.functions = {
      CHR$: c => String.fromCharCode(c),
      CLD: () => this.scope = this.functions,
      INT: c => Math.floor(c),
      INUM: c => Math.round(c)
    }
    this.types = [
      {
        reg: /^\d+ REM (.*)$/,
        parse: (r) => ({ // without () it would be a code block
          command: "REM",
          value: r[1]
        })
      },
      {
        reg: /^\d+ PRINT (.*)$/,
        parse: (r) => ({
          command: "PRINT",
          value: r[1]
        })
      },
      {
        reg: /^\d+ (LET )?(\w)=([\w\d+\-*/()]+)$/,
        parse: (r) => ({
          command: "LET",
          args: {
            var: r[2],
            expr: r[3]
          }
        })
      }, {
        reg: /^\d+ FOR (\w) *=[ 0-9A-Z+\-*\/^]+ TO ([ 0-9A-Z+\-*\/^]+)( STEP (\d))?$/,
        parse: (r) => ({
          command: "FOR"
        })
      }, {
        reg: /^\d+ END.*$/,
        parse: (r) => ({
          command: "END"
        })
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

  eval(str) {
    let result = math.evaluate(str, this.scope);
    return typeof result == "object"
      ? new ReferenceError("Variable not found in scope")
      : result;
  }
}