"""Configure Python path so 'app.*' imports resolve from the backend root."""
import sys
from pathlib import Path

# backend/ directory (two levels up from test/job-intelligence/)
BACKEND_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(BACKEND_ROOT))
