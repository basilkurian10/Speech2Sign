import os
import numpy as np
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, LSTM, Dense, Embedding, Masking, TimeDistributed
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences


loaded_model = tf.keras.models.load_model('landmark_prediction_model.keras')


loaded_model.summary()


tokenizer = Tokenizer()



import fasttext
ft = fasttext.load_model('cc.en.300.bin')

new_word_sequences = 'before'
predicted_landmarks = loaded_model.predict({'word_input': pad_sequences(tokenizer.texts_to_sequences(new_word_sequences), maxlen=180, padding='post')})
predicted_landmarks


import json
# Convert to list
array_list = predicted_landmarks.tolist()

# Save list to JSON file
with open('array2.json', 'w') as json_file:
    json.dump(array_list, json_file)

print("NumPy array saved to array2.json")

import numpy as np

# Define the filtered indices
filtered_hand = list(range(21))
filtered_pose = [11, 12, 13, 14, 15, 16]
filtered_face = [
    0, 4, 7, 8, 10, 13, 14, 17, 21, 33, 37, 39, 40, 46, 52, 53, 54, 55, 58,
    61, 63, 65, 66, 67, 70, 78, 80, 81, 82, 84, 87, 88, 91, 93, 95, 103, 105,
    107, 109, 127, 132, 133, 136, 144, 145, 146, 148, 149, 150, 152, 153, 154,
    155, 157, 158, 159, 160, 161, 162, 163, 172, 173, 176, 178, 181, 185, 191,
    234, 246, 249, 251, 263, 267, 269, 270, 276, 282, 283, 284, 285, 288, 291,
    293, 295, 296, 297, 300, 308, 310, 311, 312, 314, 317, 318, 321, 323, 324,
    332, 334, 336, 338, 356, 361, 362, 365, 373, 374, 375, 377, 378, 379, 380,
    381, 382, 384, 385, 386, 387, 388, 389, 390, 397, 398, 400, 402, 405, 409,
    415, 454, 466, 468, 473
]

HAND_NUM = len(filtered_hand)
POSE_NUM = len(filtered_pose)
FACE_NUM = len(filtered_face)

# Load your data (replace this with your actual data loading method)
data = predicted_landmarks  # Assuming the data is saved as a .npy file

# Function to process a single frame
def process_frame(frame):
    hand_coords = frame[:HAND_NUM]
    pose_coords = frame[HAND_NUM:HAND_NUM + POSE_NUM]
    face_coords = frame[HAND_NUM + POSE_NUM:HAND_NUM + POSE_NUM + FACE_NUM]
    return hand_coords, pose_coords, face_coords

# Process all frames
all_hand_coords = []
all_pose_coords = []
all_face_coords = []

for frame in data:
    hand, pose, face = process_frame(frame)
    all_hand_coords.append(hand)
    all_pose_coords.append(pose)
    all_face_coords.append(face)

# Convert lists to numpy arrays
all_hand_coords = np.array(all_hand_coords)
all_pose_coords = np.array(all_pose_coords)
all_face_coords = np.array(all_face_coords)

# Print the shapes and some sample data
print("Hand coordinates shape:", all_hand_coords.shape)
print("Sample hand coordinates:\n", all_hand_coords[0][:21])  # First 5 hand coordinates of the first frame

print("\nPose coordinates shape:", all_pose_coords.shape)
print("Sample pose coordinates:\n", all_pose_coords[0])  # All pose coordinates of the first frame

print("\nFace coordinates shape:", all_face_coords.shape)
print("Sample face coordinates:\n", all_face_coords[0][:5])  # First 5 face coordinates of the first frame


# In[ ]:





# In[ ]:





# In[ ]:





# In[ ]:


import json
import pandas as pd

# Load the JSON data
with open('./data.json') as file:
    data = json.load(file)

# Extract all hand points
hand_points = [entry['hand'] for entry in data]
print("hand_points",hand_points)

# Create a DataFrame
hand_points_df = pd.DataFrame(hand_points)

# Display information about the DataFrame
print(hand_points_df)

# Display summary statistics

# If you want to see all the data (be cautious with large datasets):
# print("\nFull DataFrame:")
# print(hand_points_df)

# If you want to save the DataFrame to a CSV file:
# hand_points_df.to_csv('hand_points.csv', index=False)

