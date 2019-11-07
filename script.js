let t = new SyntaxTree($("#input").value);

function run() {
  t.reset();
  $("#output").innerHTML = "";
  let r = {type: "START"};
  while (r.type !== "END") {
    r = t.step();
    if (r.type == "string") $("#output").innerHTML += "<br />" + r.value;
  }
}

function $(input) {
  let e = document.querySelectorAll(input);
  return e.length > 1 ? e : e[0];
}