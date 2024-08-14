import unittest
import requests
import json
import uuid

JWT_TO_USE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVmOWJiZjVkLTYxYTAtNDQyZS1iNDM0LTAyYmNhMTc4MGVjYiIsImNvbXBhbnlfaWQiOiI2NjdkZDE0OS1lZjdjLTRiNGMtYWU2Yi04Mzc1Y2VhMWVhNDgiLCJleHAiOjE3MjQ3ODYzMzIsInBlcm1pc3Npb25fbGV2ZWwiOjN9.33qXfPrUK_e0HPa84nnDwPgUE7fCjS_cYWzwyr3MrgQ"

PATH_TO_TEST_FILE = (
    "/Users/max/Documents/product_horse/static_files/temp-videos/test-viz.mp4"
)
PATH_TO_BIG_FILE = "/Users/max/Documents/product_horse/static_files/temp-videos/How_do_you_think_about_what_the_Value_of_Pave_is_t.mp4"

TEST_BIG_FILE = False


class TestGraphQL(unittest.TestCase):
    def test_create_user_and_upload_file(self):
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
        mutation SaveFilesAndTranscriptions($userId: UUID!, $files: [Upload!]!, $fileMetadata: FileMetadataInput!) {
            saveFilesAndTranscriptions(userId: $userId, files: $files, fileMetadata: $fileMetadata) {
                id
                filePath
            }
        }
        """
        if TEST_BIG_FILE:
            file_path = PATH_TO_BIG_FILE
        else:
            file_path = PATH_TO_TEST_FILE
        operations = {
            "query": query,
            "variables": {
                "userId": user_id,
                "files": [None],
                "fileMetadata": {
                    "fileType": "VIDEO",
                    "resolutionX": 1920,
                    "resolutionY": 1080,
                    "frameRate": 24,
                },
            },
        }
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

    def test_and_search_for_utterances_and_make_video(self):
        url = "http://127.0.0.1:8000/graphql"
        headers = {"Authorization": f"Bearer {JWT_TO_USE}"}
        get_user_query = """
        query GetUser {
            getUsers {
                id
            }
        }
        """
        user_response = requests.post(url, headers=headers, json={"query": get_user_query})
        self.assertEqual(user_response.status_code, 200)
        user_id = user_response.json()["data"]["getUsers"][0]["id"]
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
        transcript_ids = [transcript["id"] for transcript in transcript_response.json()["data"]["getTranscripts"]]
        question_for_ai = "Who is talking?"
        utterances_query = """
        query GetUtterances($question: String!, $transcriptIds: [String!]!) {
            getRelevantUtterances(query: $question, transcriptIds: $transcriptIds) {
                id
                text
                words {
                    id
                    text
                    start
                    end
                }
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
        self.assertTrue("data" in relevant_utterances_response.json())
        self.assertTrue("getRelevantUtterances" in relevant_utterances_response.json()["data"])
        self.assertTrue(len(relevant_utterances_response.json()["data"]["getRelevantUtterances"]) > 0)

        utterances = relevant_utterances_response.json()["data"]["getRelevantUtterances"]
        utterance_to_use = utterances[0]
        words = utterance_to_use["words"]
        last_three_words = [word["id"] for word in words[-3:]]
        create_video_mutation = """
        mutation CreateVideo($utteranceSegments: [UtteranceSegmentInput!]!, $userId: String!) {
            createVideoFromUtterances(utteranceSegments: $utteranceSegments, userId: $userId) {
                id
                title
                filePath
                renderStatus
            }
        }
        """
        utterance_segments = [
            {
                "utteranceId": utterance_to_use["id"],
                "wordIds": last_three_words,
            }
        ]
        create_video_response = requests.post(
            url,
            headers=headers,
            json={
                "query": create_video_mutation,
                "variables": {
                    "utteranceSegments": utterance_segments,
                    "userId": user_id,
                },
            },
        )
        self.assertEqual(create_video_response.status_code, 200)
        print(create_video_response.json())
        self.assertTrue("data" in create_video_response.json())
        self.assertTrue("createVideoFromUtterances" in create_video_response.json()["data"])

        get_video_query = """
        query GetVideo($id: String!) {
            getVideo(videoId: $id) {
                id
                title
                filePath
                renderStatus
            }
        }
        """
        get_video_response = requests.post(
            url,
            headers=headers,
            json={"query": get_video_query, "variables": {"id": create_video_response.json()["data"]["createVideoFromUtterances"]["id"]}},
        )
        self.assertEqual(get_video_response.status_code, 200)
        print(get_video_response.json())
        self.assertTrue("data" in get_video_response.json())
        self.assertTrue("getVideo" in get_video_response.json()["data"])
        self.assertEqual(get_video_response.json()["data"]["getVideo"]["renderStatus"], "complete")

        get_all_videos_query = """
        query GetAllVideos {
            getAllVideos {
                id
            }
        }
        """
        get_all_videos_response = requests.post(
            url, headers=headers, json={"query": get_all_videos_query}
        )
        self.assertEqual(get_all_videos_response.status_code, 200)
        print(get_all_videos_response.json())
        self.assertTrue("data" in get_all_videos_response.json())


if __name__ == "__main__":
    unittest.main()
