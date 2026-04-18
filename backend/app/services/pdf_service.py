import os
from pdf2image import convert_from_path
import base64
from app.core.config import settings
from openai import OpenAI
import io
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from app.db.vector_store import get_vector_store
from PIL import Image

client = OpenAI(
    api_key=settings.BEEKNOEE_API_KEY,
    base_url=settings.BEEKNOEE_BASE_URL
)

class PDFService:
    @staticmethod
    def encode_image(image):
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG")
        return base64.b64encode(buffered.getvalue()).decode('utf-8')

    @staticmethod
    async def extract_only(pdf_path: str):
        """Chỉ thực hiện OCR để trả text về cho người dùng hiệu đính"""
        images = convert_from_path(pdf_path)
        full_text = ""
        for i, image in enumerate(images):
            base64_image = PDFService.encode_image(image)
            response = client.chat.completions.create(
                model=settings.MODEL_VISION,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": f"Đây là trang {i+1} của một cuốn sách giáo khoa. Hãy trích xuất toàn bộ văn bản từ ảnh này một cách chính xác, giữ nguyên cấu trúc nếu có thể. Chỉ trả về văn bản trích xuất được."},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            },
                        ],
                    }
                ],
                max_tokens=2000,
            )
            page_text = response.choices[0].message.content
            full_text += f"--- TRANG {i+1} ---\n{page_text}\n\n"
        return full_text

    @staticmethod
    async def convert_and_ocr(pdf_path: str, output_dir: str, course_id: str):
        """
        Chuyển PDF thành ảnh và OCR từng trang.
        Trả về list các trang với imageUrl và ocrText.
        """
        os.makedirs(output_dir, exist_ok=True)
        images = convert_from_path(pdf_path, dpi=150)  # 150 DPI cho chất lượng tốt
        
        pages_data = []
        for i, image in enumerate(images):
            page_num = i + 1
            
            # Resize nếu cần thiết (giới hạn kích thước)
            max_width = 1200
            if image.width > max_width:
                ratio = max_width / image.width
                new_height = int(image.height * ratio)
                image = image.resize((max_width, new_height), Image.Resampling.LANCZOS)
            
            # Lưu ảnh
            image_filename = f"page_{page_num}.jpg"
            image_path = os.path.join(output_dir, image_filename)
            image.save(image_path, "JPEG", quality=85)
            
            # OCR text từ ảnh
            base64_image = PDFService.encode_image(image)
            try:
                response = client.chat.completions.create(
                    model=settings.MODEL_VISION,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": f"Đây là trang {page_num} của một cuốn sách giáo khoa. Hãy trích xuất toàn bộ văn bản từ ảnh này một cách chính xác, giữ nguyên cấu trúc nếu có thể. Chỉ trả về văn bản trích xuất được."},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{base64_image}"
                                    }
                                },
                            ],
                        }
                    ],
                    max_tokens=2000,
                )
                ocr_text = response.choices[0].message.content
            except Exception as e:
                print(f"OCR error on page {page_num}: {e}")
                ocr_text = ""
            
            pages_data.append({
                "pageNumber": page_num,
                "imageUrl": f"/pdfs/pages/{course_id}/page_{page_num}.jpg",
                "ocrText": ocr_text
            })
        
        return pages_data

    @staticmethod
    async def save_to_vector_store(text: str, lesson_id: str):
        """Nhận text đã hiệu đính và lưu vào Vector Store"""
        # Chia nhỏ text (Chunking)
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", " ", ""]
        )
        
        # Tạo Document objects từ text thô (có thể phân tách theo trang nếu text có marker)
        pages = text.split("--- TRANG")
        documents = []
        for i, page in enumerate(pages):
            if not page.strip(): continue
            documents.append(Document(
                page_content=page.strip(), 
                metadata={"lesson_id": lesson_id, "source": f"page_{i}"}
            ))
        
        texts = text_splitter.split_documents(documents)

        # Lưu vào PGVector (Neon)
        vector_store = get_vector_store(collection_name=f"lesson_{lesson_id}")
        vector_store.add_documents(texts)
        return True
