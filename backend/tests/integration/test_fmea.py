import json
import pytest
from fastapi.testclient import TestClient

from src.app import app
from src.auth.deps import get_current_user

def override_get_current_user():
    # Return a mocked user
    class MockUser:
        email = "test@example.com"
        is_active = True
    return MockUser()

app.dependency_overrides[get_current_user] = override_get_current_user
client = TestClient(app)

pytestmark = pytest.mark.usefixtures("clean_database")

def test_fmea_export():
    # 1. Load data
    with open("../docs/examples/fmea_example_design.json", "r") as f:
        data = json.load(f)
    
    # 2. Upload data
    res = client.post("/api/v1/read", json=data)
    print("Read Status:", res.status_code)
    print("Read Body:", res.json())
    assert res.status_code == 200

    # 3. Export FMEA
    res2 = client.get("/api/v1/fmea/report/design")
    print("FMEA Export Status:", res2.status_code)
    assert res2.status_code == 200
    assert len(res2.content) > 100
    
    # Check headers to ensure it's a spreadsheet
    assert "spreadsheetml.sheet" in res2.headers["content-type"]
