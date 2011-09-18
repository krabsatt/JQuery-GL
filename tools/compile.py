# Compiles the source javascript into jquery.gl.min.js
# Based on example API usage: http://code.google.com/closure/compiler/docs
#
# Usage:
#   $ python compile.py

import httplib
import os
import sys
import urllib


def assemble(include_sylvester, name):
  injected_src = ""
  files = [
  "jquery.gl-ext.js",
  "jquery.gl-material.js",
  "jquery.gl-matrix.js",
  "jquery.gl-model.js",
  ]
  if include_sylvester:
    files.append("sylvester.src.js")
  for f in files:
    injected_src += "\n\n" + open("../src/" + f).read()
  src = open("../src/jquery.gl-tpl.js").read()
  src = src.replace("//{{INJECTION_POINT}}//", injected_src)
  open("../bin/" + name, "w").write(src)


assemble(False, "jquery.gl.js")
assemble(True, "jquery.gl.sylvester.js")


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

SRC = "../"
srcs = ["bin/jquery.gl.sylvester.js"]
raw_js = "\n\n".join([open(os.path.join(SRC,f)).read() for f in srcs])

compiled = get("compiled_code", raw_js).strip();
if not compiled:
  print get("errors", raw_js)
else:
  open(os.path.join(SRC, "bin/jquery.gl.min.js"), "w").write(compiled)
  print "All is well with the world.  COMPILE SUCCEEDED."

print "Hit Enter"
sys.stdin.readline()
