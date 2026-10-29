"""Run the seven PNG profile through the shared isolated launcher."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from container_launcher import main

if __name__ == '__main__':
    main('seven', sys.argv[1:])
