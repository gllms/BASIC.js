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
QUnit.test("chr$", function (assert) {
  assert.deepEqual(t.functions.chr$(65), "A", "chr$(65) should give 'A'");
});
QUnit.test("int", function (assert) {
  assert.deepEqual(t.functions.int(32.8), 32, "int(32.8) should give 32");
});
QUnit.test("inum", function (assert) {
  assert.deepEqual(t.functions.inum(32.8), 33, "inum(32.8) should give 33");
});