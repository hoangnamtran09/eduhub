from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.schema import HumanMessage, SystemMessage
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain
from app.core.config import settings
from app.db.vector_store import get_vector_store
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain import hub

class AIService:
    def __init__(self):
        self.llm_chat = ChatOpenAI(
            openai_api_key=settings.BEEKNOEE_API_KEY,
            openai_api_base=settings.BEEKNOEE_BASE_URL,
            model_name=settings.MODEL_CHAT,
            temperature=0.7
        )
        
        self.llm_summary = ChatOpenAI(
            openai_api_key=settings.BEEKNOEE_API_KEY,
            openai_api_base=settings.BEEKNOEE_BASE_URL,
            model_name=settings.MODEL_SUMMARY,
            temperature=0.3
        )
        


    async def generate_summary(self, content: str):
        prompt = ChatPromptTemplate.from_template(
            "Bạn là một chuyên gia giáo dục. Hãy tóm tắt nội dung bài học sau đây một cách súc tích, "
            "dễ hiểu và đầy đủ các ý chính:\n\n{content}\n\nTrả lời bằng tiếng Việt."
        )
        chain = prompt | self.llm_summary
        response = await chain.ainvoke({"content": content})
        return response.content

    def get_chat_agent(self, lesson_id: str):
        vector_store = get_vector_store(collection_name=f"lesson_{lesson_id}")
        retriever = vector_store.as_retriever(search_kwargs={"k": 5})

        # Định nghĩa tool tìm kiếm trong sách
        def search_book(query: str):
            docs = retriever.get_relevant_documents(query)
            return "\n\n".join([doc.page_content for doc in docs])

        from langchain.tools import Tool

        tools = [
            Tool(
                name="search_textbook",
                func=search_book,
                description="Hữu ích khi bạn cần tìm câu trả lời trong sách giáo khoa của bài học này."
            )
        ]

        prompt = hub.pull("hwchase17/openai-functions-agent")
        
        # Tùy chỉnh system message
        prompt.messages[0] = SystemMessage(content=(
            "Bạn là một Gia sư AI thông minh và thân thiện tại EduHub. "
            "Nhiệm vụ của bạn là hỗ trợ học sinh học tập một cách tự nhiên và lôi cuốn. "
            "\n\nNGUYÊN TẮC HỖ TRỢ:"
            "\n1. Sử dụng công cụ 'search_textbook' để tìm kiếm kiến thức chính thống từ bài học. "
            "\n2. Nếu thông tin không có trong sách, hãy sử dụng kiến thức sâu rộng của mình để giải đáp, nhưng vẫn giữ đúng định hướng giáo dục. "
            "\n3. Luôn trả lời bằng tiếng Việt, văn phong gần gũi, lễ phép nhưng không quá máy móc. "
            "\n4. Khuyến khích học sinh suy nghĩ bằng các câu hỏi gợi mở. "
            "\n5. Sử dụng Markdown và LaTeX cho các công thức toán học nếu cần thiết."
        ))

        agent = create_openai_functions_agent(self.llm_chat, tools, prompt)
        agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
        
        return agent_executor

    async def chat_stream(self, message: str, lesson_id: str, history: list = []):
        agent_executor = self.get_chat_agent(lesson_id)
        
        # Chuyển đổi history sang định dạng LangChain
        chat_history = []
        for msg in history:
            if msg["role"] == "user":
                chat_history.append(HumanMessage(content=msg["content"]))
            else:
                chat_history.append(SystemMessage(content=msg["content"]))

        async for chunk in agent_executor.astream({
            "input": message,
            "chat_history": chat_history
        }):
            if "output" in chunk:
                yield chunk["output"]

ai_service = AIService()
