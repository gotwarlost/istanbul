Comparison with YUI coverage
============================

Differences in features
-----------------------

* YUI coverage - line and function coverage. Istanbul - statement, function and branch coverage.
Reverse-engineers line-coverage from statement coverage with 100% fidelity at reporting time.

* Output report formats are not as extensive as YUI coverage reporting. It supports LCOV and a custom
HTML format (all-JS implementation) that only highlights missing coverage. "Standard" LCOV HTML reports can be
gotten by running `genhtml` on the `lcov.info` file. Notice that this will also have branch coverage
information, assuming you are using a recent `lcov` version.

Differences in processing
-------------------------

YUI coverage emits a function call to increment line/ function coverage as
appropriate. The function call also tests to see if that specific line/ function
was covered before and, if not, increments the coverage count for lines/ functions
as appropriate.

Istanbul emits code that does simple post-increments of object attributes without resorting
to function calls at all. This also means that it does not keep track of derived information
and does not bother to keep track of "how many statements/ branches/ functions have been
covered so far", preferring to do this at report generation time.

Differences in coverage object and generated code
-------------------------------------------------

These are the ways in which the objects differ:

* The YUI coverage object tracks line and function execution counts and also keeps track
of how many lines/ functions were covered. The Istanbul coverage object only keeps
tracks of statement, function and branch execution counts.

* Due to the backwards-incompatible format of the Istanbul coverage object, it is not
named `_yuitest_coverage` but `__coverage__` by default. You can change this to any name you
want using an instrumenter option.

* The YUI coverage object packs the entire source code of the file into an array for every
file. The Istanbul coverage objects prefers to not do this by default and thereby does not automatically double
the size of every JS file. YAGNI. Unless you do, in which case you have to ask for it.

* All access to the YUI coverage object is of the form `global_object['/path/to/file'].property`
Istanbul generates a temporary variable name based on the MD5 hash of the file path and uses
that for assignment, as in: `_covRanDomJunk = global_object['/path/to/file']` and, subsequently
`_covRanDomJunk.property[index]++` - this avoids a hash lookup for every increment call and also
makes the generated code size smaller.

* YUI coverage emits code that is human-readable and tries to keep the lines of the generated code
in around the same place as the source. Istanbul emits minified code by default unless told not to.
There is no reason the covered code needs to look anything like the original as long as it works the
same way.

In short, Istanbul provides smaller code size and faster execution at the expense of maintaining only
raw data and no derived information (even though it tracks one extra metric).

Differences in tooling
----------------------

* Istanbul wants to be as unobtrusive as possible and provides module load hooks (for `require` and
`vm.createScript`) to transparently instrument code in a `node` environment. YUI coverage, being java,
necessitates a pre-processing build step (or an expensive runtime one).

* The same concept should be applicable for instrumenting and testing JS code meant for the browser.
Just serve your file using a nodejs server (or Yeti) and instrument your code using custom middleware/
interceptors/ whatever.

* The instrumentation command accepts wildcarded exclusion patterns so as to be able to run all the
required instrumentation in one command for the 'pre-processing step' case.

Known bugs in YUI coverage fixed
--------------------------------

The following known bugs in YUI coverage do not exist in Istanbul. This, of course, says nothing about
what _other_ bugs Istanbul might have :)

* No function calls for incrementing execution counts which implies no "Deep recursion" message from older IE (or something like that)
  when IE sees a bunch of repeated function calls to the same function.
* Statements with labels correctly handled
* `if (a) foo() else if (b) bar() else baz()` case correctly handled
* Coverage object for a file is assigned to the global object at module load only if it already does not exist in it.
This handles cases where a module is reloaded in node (as a result of nuking the `require` cache) correctly and
preserves all execution counts from the previously loaded version.
