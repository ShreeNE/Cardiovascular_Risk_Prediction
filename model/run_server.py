#!/usr/bin/env python3
"""
CorVita Backend Startup Script
===============================
Starts the FastAPI ML inference server on port 8000.
Usage:
    python3 model/run_server.py           # Default: port 8000
    python3 model/run_server.py --port 8080
"""

import sys
import os
import argparse

# Ensure PYTHONPATH includes project root
_HERE = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.dirname(_HERE)
sys.path.insert(0, _ROOT)

import uvicorn


def main():
    parser = argparse.ArgumentParser(description="CorVita ML API Server")
    parser.add_argument("--host", type=str, default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--reload", action="store_true", default=False)
    args = parser.parse_args()

    print(f"\n{'='*60}")
    print(f"  CorVita ML Inference API")
    print(f"  Starting on http://{args.host}:{args.port}")
    print(f"  API Docs: http://localhost:{args.port}/docs")
    print(f"  Health:   http://localhost:{args.port}/health")
    print(f"{'='*60}\n")

    uvicorn.run(
        "model.api:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        workers=1,
        log_level="info",
    )


if __name__ == "__main__":
    main()
