import unittest
import requests
import json
import uuid

JWT_TO_USE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijk1NmVkNWE5LWRjMmEtNDdiMS05NGFmLWFjYTQ1YTI3NDBjMyIsImNvbXBhbnlfaWQiOiJmZTE2NDI4Yi1mYTM4LTRhNGQtYjRmMC1mM2EyMGRlYWFmYjkiLCJleHAiOjE3MjMzMjkyMDgsInBlcm1pc3Npb25fbGV2ZWwiOjN9.iDZDTTaYiBwCnDKE62Kl1VomWxmqRp80cwrCmfQGujE"

PATH_TO_TEST_FILE = (
    "/Users/max/Documents/product_horse/static_files/temp-videos/test-viz.mp4"
)
PATH_TO_BIG_FILE = "/Users/max/Documents/product_horse/static_files/temp-videos/How_do_you_think_about_what_the_Value_of_Pave_is_t.mp4"

TEST_BIG_FILE = False

class TestGraphQL(unittest.TestCase):
    def test_create_user_and_upload_file_and_search_for_utterances(self):
        url = "http://127.0.0.1:8000/graphql"
        uuid_to_test = str(uuid.uuid4())
        headers = {"Authorization": f"Bearer {JWT_TO_USE}"}
        query_user = """
        mutation SaveUser($userName: String!) {
            saveUser(name: $userName) {
                id
                name
            }
        }
        """
        operations_user = {
            "query": query_user,
            "variables": {"userName": "TestEmployee"},
        }
        response_user = requests.post(url, headers=headers, json=operations_user)
        self.assertEqual(response_user.status_code, 200, "User creation failed")
        print("user response", response_user.json())
        self.assertTrue("id" in response_user.json()["data"]["saveUser"])
        user_id = response_user.json()["data"]["saveUser"]["id"]
        query = """
        mutation SaveFilesAndTranscriptions($userId: UUID!, $files: [Upload!]!) {
            saveFilesAndTranscriptions(userId: $userId, files: $files) {
                id
                filePath
            }
        }
        """
        if TEST_BIG_FILE:
            file_path = PATH_TO_BIG_FILE
        else:
            file_path = PATH_TO_TEST_FILE
        operations = {"query": query, "variables": {"userId": user_id, "files": [None]}}
        file = open(file_path, "rb")
        try:
            files = {"0": (f"{uuid_to_test}.mp4", file, "video/mp4")}
            map = {"0": ["variables.files.0"]}

            response = requests.post(
                url,
                headers=headers,
                data={"operations": json.dumps(operations), "map": json.dumps(map)},
                files=files,
            )
            self.assertEqual(response.status_code, 200)
            print(response.json())
            self.assertTrue("data" in response.json())
            self.assertTrue(
                "id" in response.json()["data"]["saveFilesAndTranscriptions"][0]
            )
        finally:
            file.close()

        transcript_query = """
        query GetTranscripts {
            getTranscripts {
                id
            }
        }
        """
        transcript_response = requests.post(
            url, headers=headers, json={"query": transcript_query}
        )
        self.assertEqual(transcript_response.status_code, 200)
        print(transcript_response.json())
        transcript_ids = [transcript["id"] for transcript in transcript_response.json()["data"]["getTranscripts"]]
        question_for_ai = "Who is talking?"
        utterances_query = """
        query GetUtterances($question: String!, $transcriptIds: [String!]!) {
            getRelevantUtterances(query: $question, transcriptIds: $transcriptIds) {
                id
            }
        }
        """
        relevant_utterances_response = requests.post(
            url,
            headers=headers,
            json={
                "query": utterances_query,
                "variables": {
                    "question": question_for_ai,
                    "transcriptIds": transcript_ids,
                },
            },
        )
        self.assertEqual(relevant_utterances_response.status_code, 200)
        print(relevant_utterances_response.json())
        self.assertTrue("data" in relevant_utterances_response.json())
        self.assertTrue("getRelevantUtterances" in relevant_utterances_response.json()["data"])


if __name__ == "__main__":
    unittest.main()
