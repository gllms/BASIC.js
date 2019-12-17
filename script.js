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
`10 REM Move submarine with WASD keys
20 X=0:Y=0
30 SHAPE (20, "00000000DFFFFFDF00"):SHAPE (21, "00FCFCFCFFFFFFFF00"):SHAPE (22, "00000000FEFFFFFE00")
40 CPOS(0,0):CLS:CPOS(X,Y):PRINT CHR$(20, 21, 22)
50 K=KEY
60 IF K=87 THEN Y=Y-1
70 IF K=65 THEN X=X-1
80 IF K=83 THEN Y=Y+1
90 IF K=68 THEN X=X+1
100 GOTO 30`,
`10 DATA "HELLO"
20 FOR I=1 TO 3
30 READ J : PRINT J
40 NEXT
50 DATA "WORLD", "!"`
];

function example(val) {
  val = parseInt(val);
  if (val >= 0) $("#input").value = examples[val]; save();
}

function $(input) {
  let e = document.querySelectorAll(input);
  return e.length > 1 ? e : e[0];
}