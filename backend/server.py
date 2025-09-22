from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import base64
import secrets
from emergentintegrations.llm.chat import LlmChat, UserMessage
import google.generativeai as genai
from PIL import Image
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'secret_key_super_securise_pour_jwt_token_recettes_2025')
security = HTTPBearer()

# Emergent LLM Configuration (fallback)
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Google Gemini Configuration (primary)
GOOGLE_GEMINI_API_KEY = os.environ.get('GOOGLE_GEMINI_API_KEY')
if GOOGLE_GEMINI_API_KEY:
    genai.configure(api_key=GOOGLE_GEMINI_API_KEY)

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    email: EmailStr
    role: str = "client"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    nom: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Recette(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    titre: str
    ingredients: str
    instructions: str
    auteur_id: str
    auteur_nom: str
    categorie: str
    image: Optional[str] = None
    approuve: bool = False
    note_moyenne: float = 0.0
    nb_votes: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RecetteCreate(BaseModel):
    titre: str
    ingredients: str
    instructions: str
    categorie: str

class RecetteNote(BaseModel):
    note: int = Field(ge=1, le=5)

class CommentaireCreate(BaseModel):
    commentaire: str

class Commentaire(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    recette_id: str
    auteur_nom: str
    commentaire: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SuggestionIA(BaseModel):
    ingredients: str

class RecetteCompleteIA(BaseModel):
    titre: str
    ingredients: str
    instructions: str
    categorie: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str

class PasswordResetToken(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    email: str
    token: str
    expires_at: datetime
    used: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_data: dict) -> str:
    payload = {
        "user_id": user_data["id"],
        "email": user_data["email"],
        "role": user_data["role"],
        "exp": datetime.now(timezone.utc) + timedelta(days=1)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user = await db.users.find_one({"id": payload["user_id"]})
        if user is None:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
        return User(**user)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token invalide")

async def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès administrateur requis")
    return current_user

def process_image(image_data: bytes) -> str:
    """Process and compress image, return base64 string"""
    try:
        img = Image.open(io.BytesIO(image_data))
        
        # Resize if too large
        max_size = (800, 600)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Save to bytes with compression
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=80, optimize=True)
        output.seek(0)
        
        # Convert to base64
        return base64.b64encode(output.getvalue()).decode('utf-8')
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur lors du traitement de l'image: {str(e)}")

def generate_reset_token() -> str:
    """Generate a secure random token for password reset"""
    return secrets.token_urlsafe(32)

def send_password_reset_email(email: str, token: str) -> bool:
    """
    Simulate sending password reset email
    In production, replace with actual email service (SendGrid, etc.)
    """
    # For now, just log the token (in production, send via email)
    print(f"Password reset token for {email}: {token}")
    print(f"Reset URL: http://localhost:3000/reset-password?token={token}")
    return True

# Authentication routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Un utilisateur avec cet email existe déjà")
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user
    user = User(
        nom=user_data.nom,
        email=user_data.email,
        role="client"
    )
    
    user_dict = user.dict()
    user_dict["password"] = hashed_password
    
    await db.users.insert_one(user_dict)
    
    # Create JWT token
    token = create_jwt_token(user.dict())
    
    return {"message": "Utilisateur créé avec succès", "token": token, "user": user}

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    # Find user
    user = await db.users.find_one({"email": login_data.email})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Verify password
    if not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Mot de passe incorrect")
    
    # Create JWT token
    user_obj = User(**user)
    token = create_jwt_token(user_obj.dict())
    
    return {"message": "Connexion réussie", "token": token, "user": user_obj}

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.post("/auth/forgot-password")
async def forgot_password(request_data: PasswordResetRequest):
    """Initiate password reset process"""
    # Check if user exists
    user = await db.users.find_one({"email": request_data.email})
    if not user:
        # Return success even if user doesn't exist (security best practice)
        return {"message": "Si cet email existe, un lien de réinitialisation a été envoyé"}
    
    # Generate reset token
    reset_token = generate_reset_token()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)  # Token expires in 1 hour
    
    # Create reset token record
    token_record = PasswordResetToken(
        user_id=user["id"],
        email=request_data.email,
        token=reset_token,
        expires_at=expires_at
    )
    
    # Save token to database
    await db.password_reset_tokens.insert_one(token_record.dict())
    
    # Send email (simulated for now)
    send_password_reset_email(request_data.email, reset_token)
    
    return {"message": "Si cet email existe, un lien de réinitialisation a été envoyé"}

@api_router.post("/auth/reset-password")
async def reset_password(reset_data: PasswordReset):
    """Complete password reset with token"""
    # Find valid token
    token_record = await db.password_reset_tokens.find_one({
        "token": reset_data.token,
        "used": False,
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })
    
    if not token_record:
        raise HTTPException(status_code=400, detail="Token invalide ou expiré")
    
    # Find user
    user = await db.users.find_one({"id": token_record["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Hash new password
    hashed_password = hash_password(reset_data.new_password)
    
    # Update user password
    await db.users.update_one(
        {"id": token_record["user_id"]},
        {"$set": {"password": hashed_password}}
    )
    
    # Mark token as used
    await db.password_reset_tokens.update_one(
        {"token": reset_data.token},
        {"$set": {"used": True}}
    )
    
    return {"message": "Mot de passe mis à jour avec succès"}

@api_router.get("/auth/verify-reset-token/{token}")
async def verify_reset_token(token: str):
    """Verify if reset token is valid"""
    token_record = await db.password_reset_tokens.find_one({
        "token": token,
        "used": False,
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })
    
    if not token_record:
        raise HTTPException(status_code=400, detail="Token invalide ou expiré")
    
    return {"valid": True, "email": token_record["email"]}

# Recipe routes
@api_router.post("/recettes")
async def create_recette(
    titre: str = Form(...),
    ingredients: str = Form(...),
    instructions: str = Form(...),
    categorie: str = Form(...),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user)
):
    # Process image if provided
    image_data = None
    if image and image.content_type.startswith('image/'):
        image_bytes = await image.read()
        image_data = process_image(image_bytes)
    
    # Create recipe
    recette = Recette(
        titre=titre,
        ingredients=ingredients,
        instructions=instructions,
        auteur_id=current_user.id,
        auteur_nom=current_user.nom,
        categorie=categorie,
        image=image_data
    )
    
    await db.recettes.insert_one(recette.dict())
    
    return {"message": "Recette ajoutée, en attente de validation par un administrateur", "recette": recette}

@api_router.get("/recettes", response_model=List[Recette])
async def get_recettes_publiques(categorie: Optional[str] = None, search: Optional[str] = None):
    filter_query = {"approuve": True}
    
    if categorie:
        filter_query["categorie"] = categorie
    
    if search:
        filter_query["$or"] = [
            {"titre": {"$regex": search, "$options": "i"}},
            {"ingredients": {"$regex": search, "$options": "i"}}
        ]
    
    recettes = await db.recettes.find(filter_query).sort("created_at", -1).to_list(100)
    return [Recette(**recette) for recette in recettes]

@api_router.get("/recettes/mes", response_model=List[Recette])
async def get_mes_recettes(current_user: User = Depends(get_current_user)):
    recettes = await db.recettes.find({"auteur_id": current_user.id}).sort("created_at", -1).to_list(100)
    return [Recette(**recette) for recette in recettes]

@api_router.get("/recettes/categories")
async def get_categories():
    return {
        "categories": [
            "Entrée",
            "Plat principal", 
            "Dessert",
            "Boisson",
            "Apéritif",
            "Petit-déjeuner",
            "Goûter",
            "Sauce",
            "Autre"
        ]
    }

@api_router.post("/recettes/{recette_id}/noter")
async def noter_recette(
    recette_id: str, 
    note_data: RecetteNote,
    current_user: User = Depends(get_current_user)
):
    # Check if recipe exists and is approved
    recette = await db.recettes.find_one({"id": recette_id, "approuve": True})
    if not recette:
        raise HTTPException(status_code=404, detail="Recette non trouvée")
    
    # Check if user already voted
    existing_vote = await db.votes.find_one({"recette_id": recette_id, "user_id": current_user.id})
    
    if existing_vote:
        # Update existing vote
        await db.votes.update_one(
            {"recette_id": recette_id, "user_id": current_user.id},
            {"$set": {"note": note_data.note}}
        )
    else:
        # Create new vote
        await db.votes.insert_one({
            "id": str(uuid.uuid4()),
            "recette_id": recette_id,
            "user_id": current_user.id,
            "note": note_data.note,
            "created_at": datetime.now(timezone.utc)
        })
    
    # Recalculate average rating
    votes = await db.votes.find({"recette_id": recette_id}).to_list(1000)
    if votes:
        total_notes = sum(vote["note"] for vote in votes)
        nb_votes = len(votes)
        note_moyenne = total_notes / nb_votes
        
        await db.recettes.update_one(
            {"id": recette_id},
            {"$set": {"note_moyenne": note_moyenne, "nb_votes": nb_votes}}
        )
    
    return {"message": "Note enregistrée avec succès"}

@api_router.post("/recettes/{recette_id}/commentaires")
async def add_commentaire(
    recette_id: str,
    comment_data: CommentaireCreate,
    current_user: User = Depends(get_current_user)
):
    # Check if recipe exists and is approved
    recette = await db.recettes.find_one({"id": recette_id, "approuve": True})
    if not recette:
        raise HTTPException(status_code=404, detail="Recette non trouvée")
    
    commentaire = Commentaire(
        recette_id=recette_id,
        auteur_nom=current_user.nom,
        commentaire=comment_data.commentaire
    )
    
    await db.commentaires.insert_one(commentaire.dict())
    return {"message": "Commentaire ajouté avec succès", "commentaire": commentaire}

@api_router.get("/recettes/{recette_id}/commentaires", response_model=List[Commentaire])
async def get_commentaires(recette_id: str):
    commentaires = await db.commentaires.find({"recette_id": recette_id}).sort("created_at", -1).to_list(100)
    return [Commentaire(**commentaire) for commentaire in commentaires]

# AI Suggestions
@api_router.post("/ia/suggestions")
async def get_suggestions_ia(suggestion_data: SuggestionIA):
    if not GOOGLE_GEMINI_API_KEY:
        # Fallback to Emergent LLM if Gemini not available
        if not EMERGENT_LLM_KEY:
            raise HTTPException(status_code=503, detail="Service IA non disponible")
        return await get_suggestions_ia_emergent(suggestion_data)
    
    try:
        # Use Google Gemini directly
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        prompt = f"""Vous êtes un chef cuisinier expert qui suggère des recettes créatives et savoureuses basées sur les ingrédients disponibles. 

Suggérez-moi une recette délicieuse avec ces ingrédients : {suggestion_data.ingredients}

Donnez-moi le titre, la liste des ingrédients nécessaires, et les instructions de préparation étape par étape.
Répondez en français."""
        
        response = model.generate_content(prompt)
        
        return {"suggestion": response.text}
    
    except Exception as e:
        # Fallback to Emergent LLM on error
        if EMERGENT_LLM_KEY:
            return await get_suggestions_ia_emergent(suggestion_data)
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération de suggestions: {str(e)}")

async def get_suggestions_ia_emergent(suggestion_data: SuggestionIA):
    """Fallback function using Emergent LLM"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"recette-{str(uuid.uuid4())}",
            system_message="Vous êtes un chef cuisinier expert qui suggère des recettes créatives et savoureuses basées sur les ingrédients disponibles. Répondez toujours en français."
        ).with_model("gemini", "gemini-2.0-flash")
        
        user_message = UserMessage(
            text=f"Suggère-moi une recette délicieuse avec ces ingrédients : {suggestion_data.ingredients}. Donne-moi le titre, la liste des ingrédients nécessaires, et les instructions de préparation étape par étape."
        )
        
        response = await chat.send_message(user_message)
        return {"suggestion": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération de suggestions: {str(e)}")

@api_router.post("/ia/generer-recette")
async def generer_recette_complete(suggestion_data: SuggestionIA):
    """Génère une recette complète avec ingrédients et instructions séparément structurés"""
    if not GOOGLE_GEMINI_API_KEY:
        # Fallback to Emergent LLM if Gemini not available
        if not EMERGENT_LLM_KEY:
            raise HTTPException(status_code=503, detail="Service IA non disponible")
        return await generer_recette_complete_emergent(suggestion_data)
    
    try:
        # Use Google Gemini directly
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        prompt = f"""Vous êtes un chef cuisinier expert. Créez une recette complète avec ces ingrédients : {suggestion_data.ingredients}

Répondez UNIQUEMENT en format JSON avec cette structure exacte :
{{
    "titre": "Nom de la recette",
    "ingredients": "Liste complète des ingrédients avec quantités (séparés par des retours à la ligne)",
    "instructions": "Instructions de préparation étape par étape (séparées par des retours à la ligne)", 
    "categorie": "Catégorie parmi: Entrée, Plat principal, Dessert, Boisson, Apéritif, Petit-déjeuner, Goûter, Sauce, Autre"
}}

Incluez TOUS les ingrédients nécessaires, pas seulement ceux fournis. Répondez en français."""
        
        response = model.generate_content(prompt)
        
        # Try to parse JSON response
        try:
            import json
            # Clean the response to extract JSON
            cleaned_response = response.text.strip()
            if cleaned_response.startswith('```json'):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.endswith('```'):
                cleaned_response = cleaned_response[:-3]
            
            recette_data = json.loads(cleaned_response)
            
            # Validate required fields
            required_fields = ['titre', 'ingredients', 'instructions', 'categorie']
            for field in required_fields:
                if field not in recette_data:
                    raise ValueError(f"Champ manquant: {field}")
            
            return {"recette": recette_data, "raw_response": response.text}
            
        except (json.JSONDecodeError, ValueError) as e:
            # If JSON parsing fails, return raw response
            return {
                "recette": None, 
                "raw_response": response.text, 
                "error": f"Erreur de parsing JSON: {str(e)}"
            }
    
    except Exception as e:
        # Fallback to Emergent LLM on error
        if EMERGENT_LLM_KEY:
            return await generer_recette_complete_emergent(suggestion_data)
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération de recette: {str(e)}")

async def generer_recette_complete_emergent(suggestion_data: SuggestionIA):
    """Fallback function using Emergent LLM"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"recette-complete-{str(uuid.uuid4())}",
            system_message="Vous êtes un chef cuisinier expert. Générez des recettes complètes et bien structurées en français. Répondez UNIQUEMENT au format JSON demandé."
        ).with_model("gemini", "gemini-2.0-flash")
        
        user_message = UserMessage(
            text=f"""Créez une recette complète avec ces ingrédients : {suggestion_data.ingredients}

Répondez UNIQUEMENT en format JSON avec cette structure exacte :
{{
    "titre": "Nom de la recette",
    "ingredients": "Liste complète des ingrédients avec quantités (séparés par des retours à la ligne)",
    "instructions": "Instructions de préparation étape par étape (séparées par des retours à la ligne)",
    "categorie": "Catégorie parmi: Entrée, Plat principal, Dessert, Boisson, Apéritif, Petit-déjeuner, Goûter, Sauce, Autre"
}}

Incluez TOUS les ingrédients nécessaires, pas seulement ceux fournis."""
        )
        
        response = await chat.send_message(user_message)
        
        # Try to parse JSON response
        try:
            import json
            cleaned_response = response.strip()
            if cleaned_response.startswith('```json'):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.endswith('```'):
                cleaned_response = cleaned_response[:-3]
            
            recette_data = json.loads(cleaned_response)
            
            required_fields = ['titre', 'ingredients', 'instructions', 'categorie']
            for field in required_fields:
                if field not in recette_data:
                    raise ValueError(f"Champ manquant: {field}")
            
            return {"recette": recette_data, "raw_response": response}
            
        except (json.JSONDecodeError, ValueError) as e:
            return {
                "recette": None, 
                "raw_response": response, 
                "error": f"Erreur de parsing JSON: {str(e)}"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération de recette: {str(e)}")

# Admin routes
@api_router.get("/admin/recettes", response_model=List[Recette])
async def get_recettes_en_attente(admin_user: User = Depends(get_admin_user)):
    recettes = await db.recettes.find({"approuve": False}).sort("created_at", -1).to_list(100)
    return [Recette(**recette) for recette in recettes]

@api_router.post("/admin/recettes/{recette_id}/approuver")
async def approuver_recette(recette_id: str, admin_user: User = Depends(get_admin_user)):
    result = await db.recettes.update_one(
        {"id": recette_id},
        {"$set": {"approuve": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Recette non trouvée")
    
    return {"message": "Recette approuvée avec succès"}

@api_router.delete("/admin/recettes/{recette_id}")
async def rejeter_recette(recette_id: str, admin_user: User = Depends(get_admin_user)):
    result = await db.recettes.delete_one({"id": recette_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Recette non trouvée")
    
    return {"message": "Recette rejetée et supprimée"}

@api_router.get("/admin/stats")
async def get_admin_stats(admin_user: User = Depends(get_admin_user)):
    total_users = await db.users.count_documents({})
    total_recettes = await db.recettes.count_documents({})
    recettes_approuvees = await db.recettes.count_documents({"approuve": True})
    recettes_en_attente = await db.recettes.count_documents({"approuve": False})
    
    return {
        "total_users": total_users,
        "total_recettes": total_recettes,
        "recettes_approuvees": recettes_approuvees,
        "recettes_en_attente": recettes_en_attente
    }

# Initialize admin user on startup
@api_router.post("/init-admin")
async def init_admin():
    # Check if admin already exists
    admin_exists = await db.users.find_one({"role": "admin"})
    if admin_exists:
        return {"message": "Administrateur déjà créé"}
    
    # Create admin user
    admin_password = "admin123"
    hashed_password = hash_password(admin_password)
    
    admin = User(
        nom="Administrateur",
        email="admin@recettes.com",
        role="admin"
    )
    
    admin_dict = admin.dict()
    admin_dict["password"] = hashed_password
    
    await db.users.insert_one(admin_dict)
    
    return {
        "message": "Compte administrateur créé avec succès",
        "email": "admin@recettes.com",
        "password": "admin123"
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()