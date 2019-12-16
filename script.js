let t = new SyntaxTree();
t.debug = false;

function run() {
  t.reset();
  t.input = $("#input").value;
  t.create();
  t.runAll();
}

function load() {
  const saved = localStorage.getItem("BASICinput");
  if (saved) {
    $("#input").innerHTML = saved;
  }
}

function save() {
  localStorage.setItem("BASICinput", $("#input").value);
}

$("#input").addEventListener("input", save);

const examples = [
`10 REM prints the first 10 fibonacci numbers
20 N=10 : A=1 : B=1
30 FOR K=1 TO N
40 S=A+B : A=B : B=S
50 PRINT B
60 NEXT`,
`10 SHAPE (20, "00000000DFFFFFDF00")
20 SHAPE (21, "00FCFCFCFFFFFFFF00")
30 SHAPE (22, "00000000FEFFFFFE00")
40 PRINT CHR$(20, 21, 22)`,
`10 IF KEY = 65 THEN GOTO 30
20 GOTO 10
30 PRINT "KEY A PRESSED"
40 GOTO 10
50 END`
];

function example(val) {
  val = parseInt(val);
  if (val >= 0) $("#input").value = examples[val]; save();
}

function $(input) {
  let e = document.querySelectorAll(input);
  return e.length > 1 ? e : e[0];
}