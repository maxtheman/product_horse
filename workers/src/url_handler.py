from urllib.parse import urlparse, parse_qs, unquote
from rich.console import Console

console = Console()

example_urls = [
    # "https://example.com/download/file.txt?token=abc123",
    # "https://example.com/download/folder/subfolder/file.mp4?token=xyz789",
    # "https://example.com/download/fe16428b-fa38-4a4d-b4f0-f3a20deaafb9/a8b99db1-7888-4c98-a0c0-8c0028b1e317/user_id_text/76f2bba2-6e2c-48e3-9d3c-f42190f4ed66.mp4/76f2bba2-6e2c-48e3-9d3c-f42190f4ed66.mp4?token=123456",
    # "https://example.com/download/file%20with%20spaces.pdf?token=space789",
    # "https://example.com/api/v1/upload?key=new_file.txt&upload_id=12345",
    "https://example.com/download/fe16428b-fa38-4a4d-b4f0-f3a20deaafb9/912784a1-151f-43de-838e-16671083b650/user_id_text/250cfda7-a992-440d-9cee-d1df1dfc6db0.mp4?token=f262d27c-1623-403b-8936-0ccaf9387acc",
    "https://example.com/download/fe16428b-fa38-4a4d-b4f0-f3a20deaafb9/1230ddc4-6bd6-4b42-9108-b264e05cb455/user_id_text/aa16cc86-ea19-479e-9885-d1123b09dcba.mp4/token",
]

def sanitize_string(s: str) -> str:
    return s.replace(" ", "_").strip("/")


def get_url_path_and_params(url: str) -> tuple[str, dict[str, str]]:
    parsed_url = urlparse(url)
    # print('parsed_url', parsed_url)
    url_path = unquote(parsed_url.path).strip("/")
    params = {
        k: sanitize_string(unquote(v[0])) for k, v in parse_qs(parsed_url.query).items()
    }
    if url_path.startswith("download/") and url_path.endswith("/token"):
        file_path = "/".join(url_path.split("/")[1:-1])  # Exclude 'download' and 'token'
        params["file_name"] = file_path
        url_path = "download_token"
    elif url_path.startswith("download/"):
        file_path = "/".join(url_path.split("/")[1:])  # Exclude 'download'
        params["file_name"] = file_path
        url_path = "download"
    return url_path, params


if __name__ == "__main__":
    for url in example_urls:
        console.log(url)
        url_path, params = get_url_path_and_params(url)
        # console.log(f"URL path: {url_path}")
        # console.log(f"Params: {params}")
        console.log('file_name', params.get("file_name"))