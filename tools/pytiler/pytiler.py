#!/usr/bin/python

import glob
import sys
import math
import Image

class FrameTiler(object):
  """Creates an image fit for texture use by tiling frames given by files."""

  def __init__(self, files):
    self._files = files
    self._size = None

  def Tile(self, output_filename):
    img = Image.open(self._files[0])
    frame_size = img.size
    fitter = FrameFitter(len(self._files), frame_size)
    fitter.Calculate()
    self._size = fitter.side, fitter.side
    tile_x = 0
    tile_y = 0
    out = Image.new("RGBA", self._size, (0, 0, 0, 0))
    for filename in self._files:
        print "Adding image %d, %d" % (tile_x, tile_y)
        frame = Image.open(filename)
        target_box = (tile_x * frame_size[0],
                      tile_y * frame_size[1],
                      (tile_x + 1) * frame_size[0],
                      (tile_y + 1) * frame_size[1])
        out.paste(frame, target_box)
        tile_x += 1
        if tile_x == fitter.cols:
          tile_x = 0
          tile_y += 1
    out.save(output_filename)

class FrameFitter(object):
  """Calculates the required image size to fit the the size and  number of
  frames given.
  """

  def __init__(self, num_frames, frame_size):
    self._num_frames = num_frames
    self._frame_size = frame_size

  @property
  def side(self):
    return self._side

  @property
  def rows(self):
    return self._rows

  @property
  def cols(self):
    return self._cols

  def Calculate(self):
    num_frames = self._num_frames
    frame_size = self._frame_size
    rows = math.sqrt(float(num_frames) * frame_size[0] / frame_size[1])
    cols = math.ceil(float(num_frames) / rows)
    rows = math.ceil(rows)
    required_dim = max(cols * frame_size[0], rows * frame_size[1])

    side = 2
    while side < required_dim:
      side *= 2
    self._side = side
    # Update rows, cols to fill rows if there's extra space
    self._rows = math.floor(float(side) / frame_size[1])
    self._cols = math.floor(float(side) / frame_size[0])

def main():
  output_filename = "out.png"
  files = sys.argv[1:]
  print "Processing %d frame files." % len(files)
  tiler = FrameTiler(files)
  tiler.Tile(output_filename)
  print "Tiled image written to %s." % output_filename


if __name__ == '__main__':
  main()
