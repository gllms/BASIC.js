const code = `10 REM this will be ignored
20 PRINT "Hello, World!"
30 A=2*9
40 B=A-10
50 PRINT B
60 END`;

let t = new SyntaxTree(code);

QUnit.module("SyntaxTree");
QUnit.test("create class", function (assert) {
  assert.deepEqual(typeof t, "object", "SyntaxTree class should be created");
});
QUnit.test("create class without arguments", function (assert) {
  assert.deepEqual(typeof new SyntaxTree(), "object", "SyntaxTree class should be created without arguments");
});

QUnit.module("functions");
QUnit.test("asc", function (assert) {
  assert.deepEqual(t.functions.asc("Apple"), 65, "chr$(\"Apple\") should give 65");
});
QUnit.test("atn", function (assert) {
  assert.deepEqual(t.functions.atn(0), 0, "atn(0) should give 0");
});
QUnit.test("chr$", function (assert) {
  assert.deepEqual(t.functions.chr$(65), "A", "chr$(65) should give 'A'");
});
QUnit.test("deg", function (assert) {
  assert.deepEqual(t.functions.deg(Math.PI/2), 90, "deg(PI/2) should give 90");
});
QUnit.test("int", function (assert) {
  assert.deepEqual(t.functions.int(32.8), 32, "int(32.8) should give 32");
});
QUnit.test("inum", function (assert) {
  assert.deepEqual(t.functions.inum(32.8), 33, "inum(32.8) should give 33");
});
QUnit.test("len", function (assert) {
  assert.deepEqual(t.functions.len("Apple"), 5, "len(\"Apple\") should give 5");
});
QUnit.test("mid$", function (assert) {
  assert.deepEqual(t.functions.mid$("Apple", 3, 2), "pl", "mid$(\"Apple\", 3, 2) should give \"pl\"");
});