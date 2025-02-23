import gradio as gr
from fastai.vision.all import *
import os
from PIL import Image
import torchvision.transforms as T

# Define the original transform class that was used during training
# This is needed because it was saved with the model
class AlbumentationsTransform(RandTransform):
    """This class must be defined to match what was saved in the model"""
    split_idx, order = None, 2
    
    def __init__(self, train_aug=None, valid_aug=None):
        super().__init__()
        store_attr()
        
    def before_call(self, b, split_idx):
        self.idx = split_idx
        
    def encodes(self, img: PILImage):
        return img  # Simply return the image as we're not using the transforms

# Define standard transforms for inference
def get_transforms():
    return T.Compose([
        T.Resize((224, 224)),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406], 
                   std=[0.229, 0.224, 0.225])
    ])

# Define model path and check if it exists
model_path = 'models/hair-resnet18-model.pkl'
if not os.path.isfile(model_path):
    raise FileNotFoundError(f"Model file not found at {model_path}")

try:
    # Load the model - now it should work since AlbumentationsTransform is defined
    print("Loading model...")
    learn = load_learner(model_path)
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {str(e)}")
    raise

def predict_hair(img):
    """
    Predicts hair type from an input image
    Returns dictionary of predictions and their probabilities
    """
    try:
        # Ensure image is in RGB mode
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Get prediction
        pred, pred_idx, probs = learn.predict(img)
        
        # Return predictions with probabilities
        return {learn.dls.vocab[i]: float(probs[i]) for i in range(len(learn.dls.vocab))}
    except Exception as e:
        print(f"Error during prediction: {str(e)}")
        return f"Error in prediction: {str(e)}"

# Set up example paths
example_paths = ["examples/1.jpg", "examples/2.jpg"]
valid_examples = [path for path in example_paths if os.path.isfile(path)]

if not valid_examples:
    print("Warning: No example images found in the examples directory")

# Create Gradio interface
demo = gr.Interface(
    fn=predict_hair,
    inputs=gr.Image(type="pil"),
    outputs=gr.Label(num_top_classes=3),
    title="Hair Type Classifier",
    description="A classifier to predict hair type: curly, straight, wavy, kinky.",
    examples=valid_examples
)

if __name__ == "__main__":
    print("Starting Gradio interface...")
    demo.launch(share=True)