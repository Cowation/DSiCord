!function(e){e([],function(){var e=function(e){return"string"!=typeof e?e:e.replace(/[\+ \|\^\%]/g,function(e){return{" ":"+","+":"%2B","|":"%7C","^":"%5E","%":"%25"}[e];});},r=function(e){return"string"!=typeof e?e:e.replace(/\+|%2B|%7C|%5E|%25/g,function(e){return{"+":" ","%2B":"+","%7C":"|","%5E":"^","%25":"%"}[e];});},n=function(e){return Number.prototype.toString.call(e,36).toUpperCase();},t=function(e){return parseInt(e,36);},i=Array.prototype.indexOf||function(e,r){for(var n=r||0,t=this.length;n<t;n++)if(this[n]===e)return n;return-1;};return{JSON:JSON,pack:function(r,t){var o=(t=t||{}).verbose||!1;o&&console.log("Normalize the JSON Object"),r="string"==typeof r?this.JSON.parse(r):r,o&&console.log("Creating a empty dictionary");var s={strings:[],integers:[],floats:[]};o&&console.log("Creating the AST");var a=function r(t){o&&console.log("Calling recursiveAstBuilder with "+this.JSON.stringify(t));var a=typeof t;if(null===t)return{type:"null",index:-3};if(void 0===t)return{type:"undefined",index:-5};if(t instanceof Array){u=["@"];for(var l in t)t.hasOwnProperty(l)&&u.push(r(t[l]));return u;}if("object"===a){var u=["$"];for(var f in t)t.hasOwnProperty(f)&&(u.push(r(f)),u.push(r(t[f])));return u;}if(""===t)return{type:"empty",index:-4};if("string"===a)return-1==(c=i.call(s.strings,t))&&(s.strings.push(e(t)),c=s.strings.length-1),{type:"strings",index:c};if("number"===a&&t%1==0)return-1==(c=i.call(s.integers,t))&&(s.integers.push(n(t)),c=s.integers.length-1),{type:"integers",index:c};if("number"===a){var c=i.call(s.floats,t);return-1==c&&(s.floats.push(t),c=s.floats.length-1),{type:"floats",index:c};}if("boolean"===a)return{type:"boolean",index:t?-1:-2};throw new Error("Unexpected argument of type "+typeof t);}(r),l=s.strings.length,u=s.integers.length;s.floats.length;o&&console.log("Parsing the dictionary");var f=s.strings.join("|");return f+="^"+s.integers.join("|"),f+="^"+s.floats.join("|"),o&&console.log("Parsing the structure"),f+="^"+function e(r){if(o&&console.log("Calling a recursiveParser with "+this.JSON.stringify(r)),r instanceof Array){var t=r.shift();for(var i in r)r.hasOwnProperty(i)&&(t+=e(r[i])+"|");return("|"===t[t.length-1]?t.slice(0,-1):t)+"]";}var s=r.type,a=r.index;if("strings"===s)return n(a);if("integers"===s)return n(l+a);if("floats"===s)return n(l+u+a);if("boolean"===s)return r.index;if("null"===s)return-3;if("undefined"===s)return-5;if("empty"===s)return-4;throw new TypeError("The item is alien!");}(a),o&&console.log("Ending parser"),t.debug?{dictionary:s,ast:a,packed:f}:f;},unpack:function(e,n){n=n||{};var i=e.split("^");n.verbose&&console.log("Building dictionary");var o=[],s=i[0];if(""!==s){s=s.split("|"),n.verbose&&console.log("Parse the strings dictionary");for(var a=0,l=s.length;a<l;a++)o.push(r(s[a]));}if(""!==(s=i[1])){s=s.split("|"),n.verbose&&console.log("Parse the integers dictionary");for(var a=0,l=s.length;a<l;a++)o.push(t(s[a]));}if(""!==(s=i[2])){s=s.split("|"),n.verbose&&console.log("Parse the floats dictionary");for(var a=0,l=s.length;a<l;a++)o.push(parseFloat(s[a]));}s=null,n.verbose&&console.log("Tokenizing the structure");for(var u="",f=[],c=i[3].length,a=0;a<c;a++){var g=i[3].charAt(a);"|"===g||"$"===g||"@"===g||"]"===g?(u&&(f.push(t(u)),u=""),"|"!==g&&f.push(g)):u+=g;}var p=f.length,h=0;return n.verbose&&console.log("Starting recursive parser"),function e(){var r=f[h++];if(n.verbose&&console.log("Reading collection type "+("$"===r?"object":"Array")),"@"===r){for(i=[];h<p;h++){var t=f[h];if(n.verbose&&console.log("Read "+t+" symbol"),"]"===t)return i;if("@"===t||"$"===t)i.push(e());else switch(t){case-1:i.push(!0);break;case-2:i.push(!1);break;case-3:i.push(null);break;case-5:i.push(void 0);break;case-4:i.push("");break;default:i.push(o[t]);}}return n.verbose&&console.log("Parsed "+this.JSON.stringify(i)),i;}if("$"===r){for(var i={};h<p;h++){var s=f[h];if("]"===s)return i;if(s=-4===s?"":o[s],"@"===(t=f[++h])||"$"===t)i[s]=e();else switch(t){case-1:i[s]=!0;break;case-2:i[s]=!1;break;case-3:i[s]=null;break;case-5:i[s]=void 0;break;case-4:i[s]="";break;default:i[s]=o[t];}}return n.verbose&&console.log("Parsed "+this.JSON.stringify(i)),i;}throw new TypeError("Bad token "+r+" isn't a type");}();}};});}("undefined"!=typeof define&&define.amd?define:function(e,r){var n=r();if("undefined"!=typeof exports)for(var t in n)exports[t]=n[t];else window.jsonpack=n;});