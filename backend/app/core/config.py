from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "EduHub AI Backend"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # Beeknoee AI
    BEEKNOEE_API_KEY: str = os.getenv("BEEKNOEE_API_KEY", "")
    BEEKNOEE_BASE_URL: str = "https://platform.beeknoee.com/api/v1"
    
    # Models
    MODEL_VISION: str = "gpt-4o"
    MODEL_SUMMARY: str = "gpt-4o-mini"
    MODEL_CHAT: str = "deepseek-chat"
    
    # Tools
    TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")

settings = Settings()
