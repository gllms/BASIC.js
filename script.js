let t = new SyntaxTree();
t.outputElement = $("#output");

function run() {
  t.reset();
  t.input = $("#input").value;
  t.create();
  $("#output").innerHTML = "";
  t.runAll();
}

function $(input) {
  let e = document.querySelectorAll(input);
  return e.length > 1 ? e : e[0];
}