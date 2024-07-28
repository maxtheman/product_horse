import unittest
import requests
import json

JWT_TO_USE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijk1NmVkNWE5LWRjMmEtNDdiMS05NGFmLWFjYTQ1YTI3NDBjMyIsImNvbXBhbnlfaWQiOiJmZTE2NDI4Yi1mYTM4LTRhNGQtYjRmMC1mM2EyMGRlYWFmYjkiLCJleHAiOjE3MjMzMjkyMDgsInBlcm1pc3Npb25fbGV2ZWwiOjN9.iDZDTTaYiBwCnDKE62Kl1VomWxmqRp80cwrCmfQGujE"

PATH_TO_TEST_FILE = "/Users/max/Documents/product_horse/static_files/temp-videos/test-viz.mp4"
PATH_TO_BIG_FILE = "/Users/max/Documents/product_horse/static_files/temp-videos/How_do_you_think_about_what_the_Value_of_Pave_is_t.mp4"

class TestGraphQL(unittest.TestCase):
    def test_upload_file(self):
        url = "http://127.0.0.1:8000/graphql"
        headers = {
            "Authorization": f"Bearer {JWT_TO_USE}"
        }
        query = """
        mutation SaveFilesAndTranscriptions($userId: UUID!, $userName: String!, $files: [Upload!]!) {
            saveFilesAndTranscriptions(userId: $userId, userName: $userName, files: $files)
        }
        """
        operations = {
            "query": query,
            "variables": {
                "userId": "956ed5a9-dc2a-47b1-94af-aca45a2740c3",
                "userName": "TestUser",
                "files": [None]
            }
        }
        file = open(PATH_TO_BIG_FILE, "rb")
        import uuid
        uuid = str(uuid.uuid4())
        try:
            files = {
                "0": (f"{uuid}.mp4", file, "video/mp4")
            }
            map = {"0": ["variables.files.0"]}
            
            response = requests.post(url, headers=headers, data={
                "operations": json.dumps(operations),
                "map": json.dumps(map)
            }, files=files)
            self.assertEqual(response.status_code, 200) 
            print(response.json())
        finally:
            file.close()

if __name__ == "__main__":
    unittest.main()