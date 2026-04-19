import os
import numpy as np
import librosa
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.utils import to_categorical

DATASET_PATH = "Binary_Drone_Audio"
SAMPLE_RATE = 22050
N_MFCC = 40

def extract_features(file_path):
    audio, sr = librosa.load(file_path, sr=SAMPLE_RATE)
    
    # Make all clips same length (3 seconds)
    max_len = SAMPLE_RATE * 3
    if len(audio) < max_len:
        audio = np.pad(audio, (0, max_len - len(audio)))
    else:
        audio = audio[:max_len]
    
    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=N_MFCC)
    mfcc_scaled = np.mean(mfcc.T, axis=0)
    
    return mfcc_scaled


features = []
labels = []

print("Loading dataset...")

for label in os.listdir(DATASET_PATH):
    folder_path = os.path.join(DATASET_PATH, label)
    
    for file in os.listdir(folder_path):
        file_path = os.path.join(folder_path, file)
        
        try:
            data = extract_features(file_path)
            features.append(data)
            labels.append(label)
        except Exception as e:
            print("Error:", file_path)

X = np.array(features)
y = np.array(labels)

# Encode labels
le = LabelEncoder()
y_encoded = le.fit_transform(y)
y_categorical = to_categorical(y_encoded)

np.save("labels.npy", le.classes_)

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y_categorical, test_size=0.2, random_state=42
)

# Build Neural Network
model = Sequential()
model.add(Dense(256, activation='relu', input_shape=(N_MFCC,)))
model.add(Dropout(0.4))
model.add(Dense(128, activation='relu'))
model.add(Dropout(0.4))
model.add(Dense(2, activation='softmax'))

model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

print("Training...")
model.fit(X_train, y_train, epochs=40, batch_size=32)

loss, accuracy = model.evaluate(X_test, y_test)
print("Test Accuracy:", accuracy)

model.save("drone_detector.h5")
print("Model saved successfully!")