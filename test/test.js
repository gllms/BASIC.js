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
QUnit.test("ASC", function (assert) {
  assert.deepEqual(t.functions.ASC("Apple"), 65, "CHR$(\"Apple\") should give 65");
});
QUnit.test("ATN", function (assert) {
  assert.deepEqual(t.functions.ATN(0), 0, "ATN(0) should give 0");
});
QUnit.test("CHR$", function (assert) {
  assert.deepEqual(t.functions.CHR$(65), "A", "CHR$(65) should give 'A'");
});
QUnit.test("DEG", function (assert) {
  assert.deepEqual(t.functions.DEG(Math.PI/2), 90, "DEG(PI/2) should give 90");
});
QUnit.test("INT", function (assert) {
  assert.deepEqual(t.functions.INT(32.8), 32, "INT(32.8) should give 32");
});
QUnit.test("INUM", function (assert) {
  assert.deepEqual(t.functions.INUM(32.8), 33, "INUM(32.8) should give 33");
});
QUnit.test("LEN", function (assert) {
  assert.deepEqual(t.functions.LEN("Apple"), 5, "LEN(\"Apple\") should give 5");
});
QUnit.test("MID$", function (assert) {
  assert.deepEqual(t.functions.MID$("Apple", 3, 2), "pl", "MID$(\"Apple\", 3, 2) should give \"pl\"");
});