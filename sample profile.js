/**
 * Created by Ralph Varjabedian on 2/20/14.
 *
 * This is a sample profile.js file needed for the profiled code to run correctly
 */

var fs = require("fs");
var level = 0;
var stack = [];
var accumulate = {};
var outputCsv = true;

var outputFolder = "/lib-profile";

function printAccumulate() {
   //json
   fs.writeFileSync("profile_output_total.json", JSON.stringify(accumulate, null, 3));
   //csv
   fs.writeFileSync("profile_output_total.csv", ['name','calls','total','subtotal','average','averagesub','\r\n'].join(','));
   for (var k in accumulate) {
      fs.appendFileSync("profile_output_total.csv", [
         '"' + k +'"',
         accumulate[k].calls,
         accumulate[k].total,
         accumulate[k].subtotal,
         accumulate[k].total/accumulate[k].calls,
         accumulate[k].subtotal/accumulate[k].calls,
         '\r\n'].join(','));
   }
}

setInterval(printAccumulate, 1000*10); // every 10 seconds

module.exports = {
   start: function(name, filename) {
      console.log(this.getPrefix(level) + name + "() {", this.getFilename(filename));
      stack.push({time: process.hrtime(), name: name, sub: 0});
      level++;
   },
   end: function(name, filename) {
      level--;
      var call = stack.pop();
      if (call.name != name)
         throw new Error("invalid stack info");
      var diff = process.hrtime(call.time);
      var ms = (diff[0] * 1000) + (diff[1] / 1e6);
      var parentCall = null;
      if (stack.length > 0)
         parentCall = stack[stack.length - 1];
      if (parentCall)
         parentCall.sub += ms;
      if (call.sub) {
         console.log(this.getPrefix(level) + "} ", ms, "ms", "sub:", call.sub, "diff:", ms - call.sub);
         if (outputCsv) {
            fs.appendFileSync("profile_output.csv", [
               '"' + this.getFilename(filename) + '"', '"' + name + '"', ms, call.sub, ms - call.sub, "\r\n"].join(','));
         }
      }
      else {
         if (outputCsv) {
            fs.appendFileSync("profile_output.csv", [
               '"' + this.getFilename(filename) + '"', '"' + name + '"', ms, 0, 0, "\r\n"].join(','));
         }
         console.log(this.getPrefix(level) + "} ", ms, "ms");
      }

      var key = this.getFilename(filename) + ":" + name;
      if (!accumulate[key])
         accumulate[key] = {calls:0,total:0, subtotal:0};
      accumulate[key].calls++;
      accumulate[key].total += ms;
      accumulate[key].subtotal += call.sub;

      if (level == 0)
         console.log(); // empty line
   },
   getFilename: function(filename) {
      return filename.substring(__dirname.length + outputFolder.length);
   },
   getPrefix: function(level) {
      var x = "";
      for (var i = 0; i < level; i++)
         x += "   ";
      return x;
   }
};
