import unittest
from src import utils

class TestUtils(unittest.TestCase):
    def setUp(self):
        pass

    def test_function1(self):
        result = utils.function1()
        self.assertEqual(result, expected_result)

    def test_function2(self):
        result = utils.function2()
        self.assertEqual(result, expected_result)

if __name__ == '__main__':
    unittest.main()