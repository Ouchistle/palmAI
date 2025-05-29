from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import load_model
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score

# Load your binary model
binary_model = load_model('models/binary_v0.keras')

# Prepare validation generator for binary classes
binary_val_datagen = ImageDataGenerator(rescale=1./255)
binary_val_gen = binary_val_datagen.flow_from_directory(
    'test/binary',      # path to root folder containing two subfolders: 'leaf' and 'not_leaf'
    target_size=(224, 224),
    batch_size=32,
    class_mode='binary', # binary labels
    shuffle=False
)

# Predict probabilities
y_prob_bin = binary_model.predict(binary_val_gen, verbose=1).ravel()
# Convert to class predictions
y_pred_bin = (y_prob_bin >= 0.5).astype(int)
# True labels
y_true_bin = binary_val_gen.classes

print("Binary Classification Report:")
print(classification_report(y_true_bin, y_pred_bin,
                            target_names=list(binary_val_gen.class_indices.keys())))

print("Binary Confusion Matrix:")
print(confusion_matrix(y_true_bin, y_pred_bin))

auc_bin = roc_auc_score(y_true_bin, y_prob_bin)
print(f"ROC-AUC: {auc_bin:.4f}")

