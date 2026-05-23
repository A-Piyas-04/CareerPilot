from fastapi import FastAPI

app = FastAPI(title="CareerPilot API")


@app.get("/")
def root():
    return {"message": "CareerPilot Backend Running"}


@app.get("/health")
def health():
    return {"status": "ok"}