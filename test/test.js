let t = new SyntaxTree();

QUnit.module("functions");
QUnit.test("CHR$", function (assert) {
  assert.deepEqual(t.functions.CHR$(65), "A", "CHR$(65) should give 'A'");
});
QUnit.test("INT", function (assert) {
  assert.deepEqual(t.functions.INT(32.8), 32, "INT(32.8) should give 32");
});
QUnit.test("INUM", function (assert) {
  assert.deepEqual(t.functions.INUM(32.8), 33, "INUM(32.8) should give 33");
});

QUnit.module("SyntaxTree");
// TODO