import { gql } from 'urql';



export const REGISTER_MUTATION = gql`
  mutation RegisterCompanyAndEmployee($name: String!, $email: String!, $password: String!, $companyName: String!) {
    registerCompanyAndEmployee(name: $name, email: $email, password: $password, companyName: $companyName) {
      ... on RegisterCompanySuccess {
        company {
          id
        }
        token
      }
      ... on FormErrors {
        errors {
          field
          message
        }
      }
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      ... on LoginSuccess {
        token
      }
      ... on FormErrors {
        errors {
          field
          message
        }
      }
    }
  }
`;

export const SAVE_USER_MUTATION = gql`
  mutation SaveUser($userName: String!, $externalId: String) {
    saveUser(name: $userName, externalId: $externalId) {
      id
      name
    }
  }
`;

export const GET_USERS_QUERY = gql`
  query GetUsers {
    getUsers {
      id
      name
    }
  }
`;

export const SAVE_FILES_MUTATION = gql`
  mutation SaveFiles($userId: UUID!, $fileMetadata: [FileMetadataInput!]!) {
    saveFiles(userId: $userId, fileMetadata: $fileMetadata) {
      id
      filePath
      fileName
    }
  }
`;

export const TRANSCRIBE_FILE_MUTATION = gql`
  mutation TranscribeFile($fileId: String!) {
    transcribeFile(fileId: $fileId) {
      id
      filePath
      fileName
    }
  }
`;



export const GET_UTTERANCES_QUERY = gql`
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
`;

export const GET_TRANSCRIPT_QUERY = gql`
  query GetTranscripts{
    getTranscripts{
      id
      fileMetadata {
        fileName
      }
    }
  }
`;

export const CREATE_VIDEO_MUTATION = gql`
  mutation CreateVideo($utteranceSegments: [UtteranceSegmentInput!]!, $title: String!) {
    createVideoFromUtterances(utteranceSegments: $utteranceSegments, title: $title) {
      id
      title
      filePath
      renderStatus
    }
  }
`;

export const GET_VIDEO_QUERY = gql`
  query GetVideo($videoId: String!) {
    getVideo(videoId: $videoId) {
      id
      title
      filePath
      renderStatus
      signedUrl
    }
  }
`;

export const GET_ALL_VIDEOS_QUERY = gql`
  query GetAllVideos {
    getAllVideos {
      id
      title
      filePath
      renderStatus
    }
  }
`;