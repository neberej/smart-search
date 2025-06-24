import uvicorn
import multiprocessing
import sys

def run():
    config = uvicorn.Config(
        "backend.api:app",
        host="127.0.0.1",
        port=8001,
        log_level="debug",
        # reuse_port=True  # make sure it's OFF for compatibility
    )
    server = uvicorn.Server(config)
    server.run()

if __name__ == "__main__":
    # Prevent forkbomb during multiprocessing
    freeze_support = getattr(multiprocessing, 'freeze_support', None)
    if freeze_support:
        freeze_support()

    if len(sys.argv) == 1:  # only main entry process
        run()
