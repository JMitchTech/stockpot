from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.config import get_settings
from api.routers import auth, menu, ingredients, waste

settings = get_settings()

app = FastAPI(
    title="Stockpot API",
    description="AI-powered restaurant operations platform",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(menu.router)
app.include_router(ingredients.router)
app.include_router(waste.router)

@app.get("/")
def root():
    return {
        "app": "Stockpot API",
        "version": "0.1.0",
        "status": "running",
        "environment": settings.app_env
    }

@app.get("/health")
def health():
    return {"status": "healthy"}