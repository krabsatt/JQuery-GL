import pytiler
import unittest

class TestFrameFitter(unittest.TestCase):

  def test_SimpleFit(self):
    ff = pytiler.FrameFitter(1, (2, 2))
    ff.Calculate()
    self.assertEqual(2, ff.side)
    self.assertEqual(1, ff.rows)
    self.assertEqual(1, ff.cols)

  def test_SimpleNoFit(self):
    ff = pytiler.FrameFitter(1, (2, 3))
    ff.Calculate()
    self.assertEqual(4, ff.side)
    self.assertEqual(1, ff.rows)
    self.assertEqual(2, ff.cols)  # Because 2 cols fit

  def test_OddSquareNoFit(self):
    ff = pytiler.FrameFitter(3, (3, 3))
    ff.Calculate()
    self.assertEqual(8, ff.side)
    self.assertEqual(2, ff.rows)
    self.assertEqual(2, ff.cols)

  def test_EvenOblongFit(self):
    ff = pytiler.FrameFitter(4, (2, 8))
    ff.Calculate()
    self.assertEqual(8, ff.side)
    self.assertEqual(1, ff.rows)
    self.assertEqual(4, ff.cols)

  def test_RegressionExample(self):
    ff = pytiler.FrameFitter(32, (251, 339))
    ff.Calculate()
    self.assertEqual(2048, ff.side)
    self.assertEqual(8, ff.cols)
    self.assertEqual(6, ff.rows)

if __name__ == "__main__":
  unittest.main()
