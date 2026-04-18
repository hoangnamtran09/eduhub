from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import PGVector
from app.core.config import settings

def get_vector_store(collection_name: str = "lesson_contents"):
    # Chuyển đổi URL Neon sang định dạng psycopg2 nếu cần
    connection_string = settings.DATABASE_URL
    if connection_string.startswith("postgres://"):
        connection_string = connection_string.replace("postgres://", "postgresql://", 1)
    
    # Sử dụng Beeknoee Embeddings (qua chuẩn OpenAI)
    embeddings = OpenAIEmbeddings(
        openai_api_key=settings.BEEKNOEE_API_KEY,
        openai_api_base=settings.BEEKNOEE_BASE_URL,
        model="text-embedding-3-small" # Hoặc model embedding của Beeknoee
    )
    
    vector_store = PGVector(
        connection_string=connection_string,
        embedding_function=embeddings,
        collection_name=collection_name,
        use_jsonb=True
    )
    
    return vector_store
