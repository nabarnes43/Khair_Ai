from flask import Flask, request, jsonify
from flask_cors import CORS
from fastai.vision.all import *
import gradio as gr
import torchvision.transforms as T
from PIL import Image
import io
import base64
import os
import threading
import socket
import traceback

# Initialize Flask app and enable CORS
flask_app = Flask(__name__)
CORS(flask_app)

# Define the AlbumentationsTransform class needed for model loading
class AlbumentationsTransform(RandTransform):
    """This class must be defined to match what was saved in the model"""
    split_idx, order = None, 2
    
    def __init__(self, train_aug=None, valid_aug=None):
        super().__init__()
        self.train_aug = train_aug
        self.valid_aug = valid_aug
        
    def before_call(self, b, split_idx):
        self.idx = split_idx
        
    def encodes(self, img: PILImage):
        return img  # Simply return the image as we're not using the transforms

class HairClassifier:
    def __init__(self, model_path=None):
        """Initialize the hair classification model"""
        # Determine the absolute path based on the location of this file
        base_dir = os.path.dirname(__file__)
        if model_path is None:
            # Navigate up one level from backend then into the desired models folder
            model_path = os.path.join(base_dir, '..', 'models', 'hair_classifier', 'models', 'hair-resnet18-model.pkl')
            model_path = os.path.abspath(model_path)
        
        print(f"Looking for model at: {model_path}")
        self.model_path = model_path
        self.learn = self.load_model()
        
        # Define standard transforms for preprocessing
        self.transform = T.Compose([
            T.Resize((224, 224)),
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406],
                       std=[0.229, 0.224, 0.225])
        ])

    def load_model(self):
        """Load the FastAI learner"""
        if not os.path.isfile(self.model_path):
            raise FileNotFoundError(f"Model file not found at {self.model_path}")
        
        try:
            print("Loading model...")
            learn = load_learner(self.model_path)
            print("Model loaded successfully!")
            return learn
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            print(f"Stack trace: {traceback.format_exc()}")
            raise

    def predict(self, img):
        """
        Predict hair type from an input image.
        Args:
            img: PIL Image object
        Returns:
            dict: Classification results with confidence scores.
        """
        try:
            # Log input image details
            print(f"Input image size: {img.size}")
            print(f"Input image mode: {img.mode}")
            
            # Create a copy of the image to avoid any reference issues
            img = img.copy()
            
            # Ensure image is in RGB mode
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize image to match what the model expects (224x224 for ResNet)
            img = img.resize((224, 224), Image.Resampling.LANCZOS)
            
            # Use FastAI's built-in prediction
            print("Starting prediction...")
            pred = self.learn.predict(img)
            
            # FastAI's predict returns (prediction, pred_idx, probabilities)
            prediction, pred_idx, probabilities = pred
            print(f"Raw prediction result: {pred}")
            
            # Convert prediction results to dictionary
            results = {
                str(self.learn.dls.vocab[i]): float(probabilities[i]) 
                for i in range(len(self.learn.dls.vocab))
            }
            print(f"Final results: {results}")
            
            return results
                
        except Exception as e:
            print(f"Detailed prediction error: {str(e)}")
            print(f"Stack trace: {traceback.format_exc()}")
            raise

# Initialize the classifier
classifier = HairClassifier()

# Test the classifier at startup
try:
    print("Testing classifier with sample image...")
    # Create a more realistic test image with some pattern
    test_image = Image.new('RGB', (224, 224))
    pixels = test_image.load()
    for i in range(224):
        for j in range(224):
            pixels[i, j] = ((i + j) % 256, (i * j) % 256, (i - j) % 256)
            
    test_result = classifier.predict(test_image)
    print("Model test successful:", test_result)
except Exception as e:
    print("Error testing model:", str(e))
    print("Test stack trace:", traceback.format_exc())

# Create Gradio interface
demo = gr.Interface(
    fn=classifier.predict,
    inputs=gr.Image(type="pil"),
    outputs=gr.Label(num_top_classes=3),
    title="Hair Type Classifier",
    description="A classifier to predict hair type: curly, straight, wavy, kinky.",
    examples=[path for path in ["examples/1.jpg", "examples/2.jpg"] if os.path.isfile(path)]
)

@flask_app.route('/api/analyze', methods=['POST', 'OPTIONS'])
def analyze_hair():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', '*')
        response.headers.add('Access-Control-Allow-Methods', '*')
        return response

    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
            
        image_data = request.json.get('image')
        if not image_data:
            return jsonify({'error': 'No image provided'}), 400

        try:
            # Extract base64 data
            if ',' in image_data:
                image_data = image_data.split(',', 1)[1]
            
            # Decode base64 to bytes
            image_bytes = base64.b64decode(image_data)
            
            # Create BytesIO object
            image_io = io.BytesIO(image_bytes)
            
            # Open image with PIL
            image = Image.open(image_io)
            
            # Immediately verify the image is valid
            image.verify()
            
            # Re-open the image after verify
            image_io.seek(0)
            image = Image.open(image_io)
            
            print(f"Successfully opened image: {image.size} {image.mode}")
            
        except Exception as e:
            print(f"Image processing error: {str(e)}")
            return jsonify({'error': f'Invalid image format: {str(e)}'}), 400

        try:
            results = classifier.predict(image)
            return jsonify({'classification': results})
            
        except Exception as e:
            print(f"Classification error: {str(e)}")
            print(f"Classification stack trace: {traceback.format_exc()}")
            return jsonify({'error': f'Classification failed: {str(e)}'}), 500

    except Exception as e:
        print(f"General error in analyze_hair: {str(e)}")
        print(f"General stack trace: {traceback.format_exc()}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@flask_app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify the service is running."""
    try:
        # Test the classifier with a small image
        test_image = Image.new('RGB', (224, 224), color='white')
        _ = classifier.predict(test_image)
        
        return jsonify({
            'status': 'healthy',
            'model_loaded': True,
            'model_path': classifier.model_path
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'model_loaded': classifier.learn is not None,
            'model_path': classifier.model_path
        }), 500

def get_free_port():
    """Return an available port by binding to port 0 and letting the OS select one."""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('', 0))  # Bind to a free port provided by the OS.
    port = s.getsockname()[1]
    s.close()
    return port

def launch_gradio():
    """Launch the Gradio interface on an available port."""
    try:
        gradio_port = get_free_port()
        print(f"Starting Gradio interface on http://localhost:{gradio_port}")
        # Launch Gradio interface with the chosen port.
        demo.launch(server_name="0.0.0.0", server_port=gradio_port, share=False)
    except Exception as e:
        print(f"Error launching Gradio: {e}")

def run_app(flask_port=8000):
    """Run Flask app and Gradio interface concurrently."""
    # Start Gradio in a separate thread
    gradio_thread = threading.Thread(target=launch_gradio)
    gradio_thread.daemon = True
    gradio_thread.start()

    # Run Flask app
    print(f"Starting Flask server on http://localhost:{flask_port}")
    flask_app.run(debug=True, port=flask_port, host='0.0.0.0')

if __name__ == '__main__':
    run_app()