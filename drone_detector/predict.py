import numpy as np
import librosa
from tensorflow.keras.models import load_model

SAMPLE_RATE = 22050
N_MFCC = 40

model = load_model("drone_detector.h5")
labels = np.load("labels.npy")

def extract_features(file_path):
    audio, sr = librosa.load(file_path, sr=SAMPLE_RATE)
    
    max_len = SAMPLE_RATE * 3
    if len(audio) < max_len:
        audio = np.pad(audio, (0, max_len - len(audio)))
    else:
        audio = audio[:max_len]
    
    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=N_MFCC)
    mfcc_scaled = np.mean(mfcc.T, axis=0)
    
    return mfcc_scaled


def predict_audio(file_path):
    features = extract_features(file_path)
    features = features.reshape(1, -1)

    prediction = model.predict(features)
    
    class_index = np.argmax(prediction)
    confidence = float(np.max(prediction))
    
    return {
        "prediction": labels[class_index],
        "confidence": round(confidence, 4)
    }