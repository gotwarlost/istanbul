# Format of coverage.json

`coverage.json` contains a report object, which is a hash where keys are file names (absolute
paths), and values are coverage data for that file (the result of
`json.stringify(collector.fileCoverageFor(filename))`)  Each entry consists of:

* `path` - The path to the file.  This is an absolute path, and should be the same as the
  key in the report object.
* `s` - Hash of statement counts, where keys as statement IDs.
* `b` - Hash of branch counts, where keys are branch IDs and values are arrays of counts.
  For an if statement, the value would have two counts; one for the if, and one for the
  else.  Switch statements would have an array of values for each case.
* `f` - Hash of function counts, where keys are function IDs.
* `fnMap` - Hash of functions where keys are function IDs, and values are `{name, line, loc, skip}`,
  where `name` is the name of the function, `line` is the line the function is declared on,
  and `loc` is the `Location` of the function declaration (just the declaration, not the entire
  function body - see 'Location Objects' below.)  If `skip` is present and true, then this
  indicates that this function was ignored by a `### instabul ignore ... ###` pragma.  Note that
  if a function is not ignored the `skip` field will be missing entirely.
* `statementMap` - Hash where keys are statement IDs, and values are `Location` objects for each
  statement.  The `Location` for a function definition is really an assignment, and should
  include the entire function.  In addition to the normal location object fields, a
  `statementMap` entry can also have an optional `skip` field.
* `branchMap` - Hash where keys are branch IDs, and values are `{line, type, locations}` objects.
  `line` is the line the branch starts on.  `type` is the type of the branch (e.g. "if", "switch").
  `locations` is an array of `Location` objects, one for each possible outcome of the branch.
  Note for an `if` statement where there is no `else` clause, there will still be two `locations`
  generated.  Istanbul does *not* generate coverage for the `default` case of a switch statement
  if `default` is not explicitly present in the source code.
* `l` - Hash of line counts, where keys are the line number.

  `locations` for an if statement are always 0-length and located at the start of the `if` (even
  the location for the "else").  For a `switch` statement, `locations` start at the start of the
  `case` statement and go to the end of the line before the next case statement (note Istanbul
  does nothing clever here if a `case` is missing a `break`.)  Each location in `locations` can
  also optionally have a `skip: true` field to indicate that this branch was ignored.

IDs used in the fnMap, statementMap, and branchMap are sequential integers, starting at 1.

## Location Objects

Location objects are a `{start: {line, column}, end: {line, column}}` object that describes
the start and end of a piece of code.  Note that `line` is 1-based, but `column` is 0-based.
