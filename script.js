let t;

function run() {
  t = new SyntaxTree($("#input").value);
  $("#output").innerHTML = "Hello, World!";
}

function $(input) {
  let e = document.querySelectorAll(input);
  return e.length > 1 ? e : e[0];
}