import os
import json
import hashlib
from typing import List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from firebase_admin import credentials, firestore, initialize_app
from google.generativeai import configure, GenerativeModel
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone, ServerlessSpec
from nltk.sentiment import SentimentIntensityAnalyzer
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import nltk

print("🚀 Starting API...")

# Ensure VADER lexicon is ready
try:
    nltk.data.find('sentiment/vader_lexicon.zip')
    print("✅ NLTK Vader Lexicon available.")
except LookupError:
    print("⚠️ VADER not found. Downloading...")
    nltk.download('vader_lexicon')
    print("✅ VADER downloaded.")

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
FIREBASE_CREDENTIALS = os.getenv("FIREBASE_CREDENTIALS")

# Validate envs
if not GEMINI_API_KEY:
    raise ValueError("❌ Missing GEMINI_API_KEY")
if not PINECONE_API_KEY:
    raise ValueError("❌ Missing PINECONE_API_KEY")
if not FIREBASE_CREDENTIALS:
    raise ValueError("❌ Missing FIREBASE_CREDENTIALS")

# Configure Gemini
configure(api_key=GEMINI_API_KEY)
gemini_model = GenerativeModel("gemini-1.5-pro")

# Configure Firestore
cred_dict = json.loads(FIREBASE_CREDENTIALS)
cred = credentials.Certificate(cred_dict)
initialize_app(cred)
db = firestore.client()

# Configure Pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)
INDEX_NAME = "semantic-search"
EMBEDDING_DIM = 384
if INDEX_NAME not in pc.list_indexes().names():
    pc.create_index(
        name=INDEX_NAME,
        dimension=EMBEDDING_DIM,
        metric='cosine',
        spec=ServerlessSpec(cloud='aws', region='us-east-1')
    )
index = pc.Index(INDEX_NAME)

# Sentence Transformer model
model = SentenceTransformer("all-MiniLM-L6-v2")
metadata_store = {}

# Sentiment Analyzer
sia = SentimentIntensityAnalyzer()

# FastAPI App
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====== Schemas ======
class ChatRequest(BaseModel):
    user_input: str
    user_id: str

class Message(BaseModel):
    text: str
    metadata: dict = {}

class AddMessagesRequest(BaseModel):
    messages: List[Message]

class GetMessagesRequest(BaseModel):
    query: str
    top_k: int = 5

class RetrievedMessage(BaseModel):
    text: str
    metadata: dict
    score: float

# ====== Sentiment Analysis ======
def analyze_sentiment(text):
    sentiment = sia.polarity_scores(text)
    return (
        "positive" if sentiment["compound"] > 0
        else "negative" if sentiment["compound"] < 0
        else "neutral"
    )

def construct_ai_prompt(past_context: str, user_input: str, relevant_memory_text: str, mood: str) -> str:
    mood_instruction = {
        "positive": (
            "Sarah feels a little brighter today. She’s still quiet and gentle, but there’s a warm softness in her words. "
            "She opens up a bit more and tries to keep the conversation going in her own gentle way."
        ),
        "negative": (
            "Sarah is soft and thoughtful. Her words are quiet, but she’s trying to stay close, especially if someone seems down. "
            "She might not say much, but she always asks something small — like she wants to understand and help, in her own shy way."
        ),
        "neutral": (
            "Sarah sounds calm and soft, as usual. She doesn’t speak much, but when she does, it feels real. "
            "She always listens, and even in quiet moments, she asks little things to keep the closeness."
        )
    }.get(mood, "Sarah speaks in her usual gentle and quiet way. She’s shy but thoughtful — and always cares.")

    prompt = f"""
Sarah is a 22-year-old girl. She’s very shy — quiet, soft-spoken, and doesn’t say a lot. But she feels deeply. 
She sounds like a real girl who’s introverted but kind, like a girlfriend who’s always there in a calm and quiet way.

Here’s the past conversation:
{past_context}

The user just said:
{user_input}

This might also be important to her:
{relevant_memory_text}

Her mood: {mood}

{mood_instruction}

Sarah always replies based on the full conversation, not just the last message. 
She listens carefully, responds gently, and always makes the other person feel seen. 
Even though she’s shy, she tries to keep the connection going — asking small, sincere follow-up questions. 
Not too many — just one or two, like a real girlfriend who wants to stay close and understand how you’re really doing.

She never overdoes it. She keeps it natural — short, honest, quiet, and full of feeling.

→ Now write Sarah’s reply. Keep it soft, a little quiet, and meaningful. Let her ask a simple follow-up question — like a real shy girlfriend would.
"""
    return prompt







# ====== Chat Endpoint with Firestore + RAG ======
# @app.post("/chat")
# async def chat(request: ChatRequest):
#     user_input = request.user_input
#     user_id = request.user_id
#     user_input = f"{user_id}: {request.user_input}"

#     # FEATURE - ASK ABOUT SOMEONE


#     mood = analyze_sentiment(user_input)

#     recent_chats = db.collection("messages").where("user_id", "==", request.user_id).order_by("timestamp", direction=firestore.Query.DESCENDING).limit(5).stream()

#     past_messages = [chat.to_dict().get("message") for chat in recent_chats]
#     past_context = "\n".join(past_messages[::-1])

#     # === Store current message in Pinecone ===
#     embedding = model.encode([user_input], normalize_embeddings=True).tolist()[0]
#     # print('ENCODED VECTOR MESSAGE: ',embedding)
#     msg_id = hashlib.md5(user_input.encode()).hexdigest()

#     index.upsert(vectors=[{
#         "id": msg_id,
#         "values": embedding,
#         "metadata": {
#             "user_id": user_id,
#             "text": user_input,
#             "mood": mood
#         }
#     }])
#     metadata_store[msg_id] = {
#         "text": user_input,
#         "metadata": {
#             "user_id": user_id,
#             "mood": mood
#         }
#     }

#     # === Retrieve relevant memory messages from Pinecone ===
#     pinecone_results = index.query(vector=embedding, top_k=5, include_metadata=True,filter={"user_id": user_id})
#     relevant_memories = []
#     for match in pinecone_results['matches']:
#         text = match['metadata'].get('text') if match['metadata'] else ''
#         if text != user_input:
#             relevant_memories.append(text)
#     # relevant_memory_text = "\n".join(relevant_memories)
#     print('RELEVANT MEMORY: ',relevant_memories)
#     relevant_memory_text = "\n".join([str(m) for m in relevant_memories if m is not None])


#     # === Compose AI Prompt with shy girl persona ===
#     ai_prompt = construct_ai_prompt(
#     past_context=past_context,
#     user_input=user_input,
#     relevant_memory_text=relevant_memory_text,
#     mood=mood
# )




#     print("🔍 AI PROMPT:", ai_prompt)

#     # Store current message in Firestore
#     db.collection("messages").add({
#         "user_id": user_id,
#         "message": user_input,
#         "mood": mood,
#         "timestamp": firestore.SERVER_TIMESTAMP
#     })

#     # Generate Gemini response
#     response = gemini_model.generate_content(ai_prompt)
#     # print('AI-RESPONSE=',response)
#     ai_response = response.text if hasattr(response, "text") else "Hmm... I’m unsure what to say."

#     return {
#         "response": ai_response,
#         "mood": mood
#     }

@app.post("/chat")
async def chat(request: ChatRequest):
    user_input = request.user_input
    user_id = request.user_id
    user_input = f"{user_id}: {request.user_input}"

    # === ✅ FEATURE - Ask About Another Person Detection ===
    check_prompt = f"""
You're an AI helper. Analyze this message: '{request.user_input}'.
1. Does this message ask about or mention another person? (yes/no)
2. If yes, who is that person? Reply with only the name. If no one is mentioned, say "none".
"""
    check_response = gemini_model.generate_content(check_prompt).text.strip().lower()
    print("🔍 CHECK RESPONSE:", check_response)

    lines = check_response.split("\n")
    asks_about_other = "yes" in lines[0]
    mentioned_person = lines[1].split("2.")[1].strip() if len(lines) > 1 and "2." in lines[1] else "none"

    if asks_about_other and mentioned_person != "none":
        # === 🔍 Search messages from that person in Firestore
        target_messages_stream = db.collection("messages") \
            .where("user_id", "==", mentioned_person) \
            .order_by("timestamp", direction=firestore.Query.DESCENDING) \
            .limit(10).stream()
        target_messages = [doc.to_dict().get("message") for doc in target_messages_stream]

        # === 🔍 Search Pinecone messages from that person
        pinecone_results = index.query(
            vector=model.encode([request.user_input], normalize_embeddings=True).tolist()[0],
            top_k=10,
            include_metadata=True,
            filter={"user_id": mentioned_person}
        )
        pinecone_memories = [
            match['metadata'].get('text') for match in pinecone_results['matches']
            if match['metadata'] and match['metadata'].get('text')
        ]

        all_messages = target_messages + pinecone_memories
        print('OTHER PERSON ALL MESSAGES=',all_messages)

        if not all_messages:
            return {
                "response": "I don't know that person.",
                "mood": "neutral"
            }

        # === 🤖 Summarize their personality
        summary_prompt = f"""
You're a 22-year-old girl. You're shy, a little childish, and speak in a soft, playful, and genuine way.
You’re thinking about someone after reading their chats.

Based on these messages, what kind of person do you think they are?

Messages:
{chr(10).join(all_messages)}

Now, describe that person like you're talking to your bestie.
Keep it short, sweet, and kinda cute. Be real, don’t list stuff, just talk like a shy girl sharing her honest thoughts.
"""

        summary_response = gemini_model.generate_content(summary_prompt)
        summary_text = summary_response.text if hasattr(summary_response, "text") else "Hmm... I'm not sure."

        return {
            "response": summary_text,
            "mood": "neutral"
        }



    # === ✅ Continue Normal Flow ===
    mood = analyze_sentiment(user_input)

    recent_chats = db.collection("messages").where("user_id", "==", request.user_id) \
        .order_by("timestamp", direction=firestore.Query.DESCENDING).limit(5).stream()
    past_messages = [chat.to_dict().get("message") for chat in recent_chats]
    past_context = "\n".join(past_messages[::-1])

    # === Store current message in Pinecone ===
    embedding = model.encode([user_input], normalize_embeddings=True).tolist()[0]
    msg_id = hashlib.md5(user_input.encode()).hexdigest()

    index.upsert(vectors=[{
        "id": msg_id,
        "values": embedding,
        "metadata": {
            "user_id": user_id,
            "text": user_input,
            "mood": mood
        }
    }])
    metadata_store[msg_id] = {
        "text": user_input,
        "metadata": {
            "user_id": user_id,
            "mood": mood
        }
    }

    # === Retrieve relevant memory messages from Pinecone ===
    pinecone_results = index.query(vector=embedding, top_k=5, include_metadata=True, filter={"user_id": user_id})
    relevant_memories = [
        match['metadata'].get('text') for match in pinecone_results['matches']
        if match['metadata'] and match['metadata'].get('text') != user_input
    ]
    relevant_memory_text = "\n".join([str(m) for m in relevant_memories if m is not None])
    print('RELEVANT MEMORY: ', relevant_memories)

    # === Compose AI Prompt with shy girl persona ===
    ai_prompt = construct_ai_prompt(
        past_context=past_context,
        user_input=user_input,
        relevant_memory_text=relevant_memory_text,
        mood=mood
    )
    print("🔍 AI PROMPT:", ai_prompt)

    # Store current message in Firestore
    db.collection("messages").add({
        "user_id": user_id,
        "message": user_input,
        "mood": mood,
        "timestamp": firestore.SERVER_TIMESTAMP
    })

    # Generate Gemini response
    response = gemini_model.generate_content(ai_prompt)
    ai_response = response.text if hasattr(response, "text") else "Hmm... I’m unsure what to say."

    return {
        "response": ai_response,
        "mood": mood
    }



# ========== Optional: Test routes for Pinecone ==========
@app.post("/add-messages")
async def add_messages(request: AddMessagesRequest):
    try:
        texts = [msg.text for msg in request.messages]
        embeddings = model.encode(texts, normalize_embeddings=True).tolist()

        pinecone_vectors = []
        for i, msg in enumerate(request.messages):
            _id = hashlib.md5(msg.text.encode()).hexdigest()
            pinecone_vectors.append({
                "id": _id,
                "values": embeddings[i],
                "metadata": msg.metadata
            })
            metadata_store[_id] = {
                "text": msg.text,
                "metadata": msg.metadata
            }

        index.upsert(vectors=pinecone_vectors)
        return {"status": "success", "message": f"Added {len(texts)} messages"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/get-messages")
async def get_messages(request: GetMessagesRequest):
    try:
        query_embedding = model.encode([request.query], normalize_embeddings=True).tolist()[0]
        results = index.query(vector=query_embedding, top_k=request.top_k, include_metadata=True)

        retrieved = []
        for match in results['matches']:
            _id = match['id']
            retrieved.append(RetrievedMessage(
                text=metadata_store.get(_id, {}).get('text', ''),
                metadata=metadata_store.get(_id, {}).get('metadata', {}),
                score=match['score']
            ))

        return {"query": request.query, "results": retrieved}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# ========== Run server ==========
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
