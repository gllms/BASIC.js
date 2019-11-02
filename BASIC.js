class SyntaxTree {
  constructor(input) {
    this.input = input;
    this.pos = 0;
    this.tree = {};
    this.scope = {};
    this.types = [
      {
        reg: /^\d+ (LET )?(\w)=([\w\d+\-*/()]+)$/,
        parse: (r) => ({ // without () it would be a code block
          command: "LET",
          args: {var: r[2], expr: r[3]}
        })
      },{
        reg: /^\d+ FOR (\w) *=[ 0-9A-Z+\-*\/^]+ TO ([ 0-9A-Z+\-*\/^]+)( STEP (\d))?$/,
        parse: (r) => ({
          // TODO
        })
      }
    ];
    this.create();
  }

  // create the syntax tree
  create() {
    // split into seperate lines
    this.lines = this.input.split("\n");
    
    // loop over each line
    this.lines.forEach(line => {
      let words = line.split(" ");  // split into words
      let lineNumber = words[0];

      // check if first "word" is a number
      if (!lineNumber.match(/^\d+$/)) {
        throw new SyntaxError("Lines has to start with numbers");
      }

      // TODO: check against types array
      let regs = this.types.map((e)=>e.reg); // gives all the RegExp's in the array as an array
      let type = this.types.findIndex((e, i) => regs[i].reg.test(line));
      console.log(type);
    });
  }

  eval(str) {
    let result = math.evaluate(str, this.scope);
    return typeof result == "object"
      ? new ReferenceError("Variable not found in scope")
      : result;
  }
}