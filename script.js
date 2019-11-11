let t = new SyntaxTree();
t.debug = true;

function run() {
  t.reset();
  t.input = $("#input").value;
  t.create();
  $("#output").innerHTML = "";
  let r = { type: "START" };
  let results = [];
  while (r.type !== "END") {
    r = t.step();
    if (r.type == "string") {
      results.push(r.value);
      $("#output").innerHTML = results.join("<br />");
    }
  }
}

function $(input) {
  let e = document.querySelectorAll(input);
  return e.length > 1 ? e : e[0];
}