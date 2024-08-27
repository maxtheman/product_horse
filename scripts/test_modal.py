import modal
from typing import TypedDict, List

app = modal.App("test-app")


class ArbitraryInput(TypedDict):
    x: int
    y: int

@app.function()
def test_multiple_inputs(
    x_list: List[ArbitraryInput],
    y_list: List[str],
    z: str,
):
    return x_list, y_list, z