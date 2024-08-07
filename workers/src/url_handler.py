from urllib.parse import urlparse, parse_qs, unquote
from rich.console import Console

console = Console()

example_urls = [
    "https://example.com/download/file.txt?token=abc123",
    "https://example.com/download/folder/subfolder/file.mp4?token=xyz789",
    "https://example.com/download/fe16428b-fa38-4a4d-b4f0-f3a20deaafb9/a8b99db1-7888-4c98-a0c0-8c0028b1e317/user_id_text/76f2bba2-6e2c-48e3-9d3c-f42190f4ed66.mp4/76f2bba2-6e2c-48e3-9d3c-f42190f4ed66.mp4?token=123456",
    "https://example.com/download/file%20with%20spaces.pdf?token=space789",
    "https://example.com/api/v1/upload?key=new_file.txt&upload_id=12345",
]

def sanitize_string(s: str) -> str:
    return s.replace(' ', '_').replace('/', '_')

def get_url_path_and_params(url: str) -> tuple[str, dict[str, str]]:
    parsed_url = urlparse(url)
    # print('parsed_url', parsed_url)
    url_path = unquote(parsed_url.path).strip('/')
    params = {k: sanitize_string(unquote(v[0])) for k, v in parse_qs(parsed_url.query).items()}
    if url_path.startswith('download/'):
        file_name = sanitize_string(url_path[len('download/'):])
        params['file_name'] = file_name
    return url_path, params


if __name__ == "__main__":
    for url in example_urls:
        console.log(url)
        console.log(get_url_path_and_params(url))