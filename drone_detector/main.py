from fastapi import FastAPI, UploadFile, File
import shutil
import os
from predict import predict_audio

app = FastAPI()

@app.post("/detect/")
async def detect_sound(file: UploadFile = File(...)):
    
    temp_file = f"temp_{file.filename}"
    
    with open(temp_file, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    result = predict_audio(temp_file)
    
    os.remove(temp_file)
    
    return result