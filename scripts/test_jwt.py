import unittest
from workers.jwt import encode_jwt, decode_jwt

class TestJWT(unittest.TestCase):
    def test_encode_decode(self):
        payload = {"sub": "1234567890", "name": "John Doe"}
        secret = "test_secret"
        token = encode_jwt(payload, secret)
        print(token)
        decoded = decode_jwt(token, secret)
        print(decoded)
        self.assertEqual(payload, decoded)

    def test_invalid_signature(self):
        token = encode_jwt({"sub": "1234"}, "secret1")
        print(token)
        with self.assertRaises(ValueError):
            decode_jwt(token, "secret2")

if __name__ == '__main__':
    unittest.main()