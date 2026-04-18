from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import shutil
from app.services.pdf_service import PDFService
from app.services.ai_service import ai_service
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Trong thực tế nên giới hạn lại
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    lesson_id: str
    chat_history: Optional[List[dict]] = []

class SaveLessonRequest(BaseModel):
    lesson_id: str
    text: str

class SummaryRequest(BaseModel):
    content: str

@app.post("/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
    """Giai đoạn 1: OCR trích xuất text từ PDF"""
    temp_dir = "temp_pdfs"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        full_text = await PDFService.extract_only(file_path)
        return {"extracted_text": full_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/convert-pdf-to-images")
async def convert_pdf_to_images(
    file: UploadFile = File(...),
    course_id: str = Form(...),
    output_dir: str = Form(...)
):
    """
    Chuyển PDF thành ảnh và OCR.
    Trả về list các trang với imageUrl và ocrText.
    """
    temp_dir = "temp_pdfs"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        pages_data = await PDFService.convert_and_ocr(file_path, output_dir, course_id)
        return {
            "success": True,
            "totalPages": len(pages_data),
            "pages": pages_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/save-lesson")
async def save_lesson(request: SaveLessonRequest):
    """Giai đoạn 1: Lưu text đã hiệu đính vào Vector Store"""
    try:
        await PDFService.save_to_vector_store(request.text, request.lesson_id)
        # Tự động tạo tóm tắt sau khi lưu
        summary = await ai_service.generate_summary(request.text)
        return {"status": "success", "summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(request: ChatRequest):
    """Giai đoạn 2: Truy vấn dữ liệu với Streaming và RAG"""
    try:
        async def stream_response():
            async for chunk in ai_service.chat_stream(
                request.message, 
                request.lesson_id, 
                request.chat_history
            ):
                yield chunk

        return StreamingResponse(stream_response(), media_type="text/plain")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize")
async def summarize(request: SummaryRequest):
    try:
        summary = await ai_service.generate_summary(request.content)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
