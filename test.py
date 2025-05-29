from tensorflow.keras.preprocessing import image
from tensorflow.keras.models import load_model
import numpy as np

model = load_model("disease.keras")

class_names = {
    0:"black_scorch", 
    1:"fusarium_wilt", 
    2:"healthy",
    3:"magnesium_deficiency", 
    4:"manganese_deficiency", 
    5:"parlatoria_blanchardi", 
    6:"potassium_deficiency", 
    7:"rachis_blight"
}

img = image.load_img('some_healthy.png', target_size=(224,224))
x   = image.img_to_array(img) / 255.0
x   = np.expand_dims(x, 0)
p   = model.predict(x)[0]
top3 = np.argsort(p)
print([(class_names[i], p[i]) for i in top3])