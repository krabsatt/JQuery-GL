# Copyright (c) 2011 Kevin Rabsatt
#
# A tool that converts simple .obj files into .jsonp format
#
# Usage:
#   $ python obj2json.py input output

import sys

if len(sys.argv) != 3:
  print ("Please Use the script as follows:\n"
         " python obj2json.py input output")
  exit()
input_filename = sys.argv[1]
output_filename = sys.argv[2]

verts = []
faces =[]
obj = {
    "faces": faces,
    "verts": verts
    }
print "Reading %s..." % input_filename
for line in open(input_filename):
  parts = line.strip().split(" ")
  parts = filter(lambda x: x, parts)
  if not parts:
    continue
  if parts[0] in ["v", "f"]:
    assert len(parts) == 4, line + str(parts)
    if parts[0] == "v":
      for v in parts[1:]:
        verts.append(float(v))
    if parts[0] == "f":
      for f in parts[1:]:
        faces.append(int(f) - 1)

print "Writing to %s..." % output_filename
f = open(output_filename, "w")
f.write(str(obj).replace("'","\""))  # Strict json parsing requires "

