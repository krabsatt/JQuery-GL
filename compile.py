# Compiles the source javascript into jquery.gl.min.js
# Based on example API usage: http://code.google.com/closure/compiler/docs
#
# Usage:
#   $ python compile.py

import httplib
import sys
import urllib


def get(output, js):
  params = urllib.urlencode([
    ("js_code", js),
    ("compilation_level", "SIMPLE_OPTIMIZATIONS"),
    ("output_info", output),
    ])
  headers = { "Content-type": "application/x-www-form-urlencoded" }
  conn = httplib.HTTPConnection("closure-compiler.appspot.com")
  conn.request("POST", "/compile", params, headers)
  response = conn.getresponse()
  data = response.read()
  conn.close
  return data


srcs = ["src/jquery.gl.js", "src/sylvester.src.js"]
raw_js = "\n\n".join([open(f).read() for f in srcs])

compiled = get("compiled_code", raw_js).strip();
if not compiled:
  print get("errors", raw_js)
else:
  open("src/jquery.gl.min.js", "w").write(compiled)
  print "All is well with the world.  COMPILE SUCCEEDED."
