import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Camera, Upload } from 'lucide-react'
import { CameraDialog } from './CameraDialog'

// Types for our application
interface ClassificationResult {
  straight: number
  wavy: number
  curly: number
  coily: number
  protective: number
}

// Mock recommendations database - keep this for now
const recommendationDatabase = {
  straight: {
    shampoo: 'Volumizing Shampoo',
    conditioner: 'Lightweight Conditioner',
    treatment: 'Shine Serum',
    styling: 'Heat Protectant Spray'
  },
  wavy: {
    shampoo: 'Sulfate-Free Shampoo',
    conditioner: 'Moisturizing Conditioner',
    treatment: 'Leave-in Conditioner',
    styling: 'Wave Enhancing Cream'
  },
  // ... other types remain the same
}

const HairAnalysisSystem = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setSelectedImage(reader.result as string)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  const handleAnalysis = async () => {
    if (!selectedImage) {
      setError('Please upload an image first')
      return
    }
    
    setIsAnalyzing(true)
    setError(null)
    
    try {
      console.log("Starting analysis...")
      console.log("Image data length:", selectedImage.length)

      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        mode: 'cors', // Explicitly state we want CORS
        credentials: 'omit', // Don't send credentials
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          image: selectedImage
        }),
      })

      console.log("Response status:", response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Server error response:", errorText)
        throw new Error(errorText || 'Analysis failed')
      }

      const data = await response.json()
      console.log("Classification result:", data)
      setClassificationResult(data.classification)
    } catch (error: unknown) {
      console.error("Error in analysis:", error)
      if (error instanceof Error) {
        setError(`Error analyzing image: ${error.message}`)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCameraCapture = (imageData: string) => {
    setSelectedImage(imageData);
    setError(null);
  }

  // Get the dominant hair type from classification results
  const getDominantType = (): string | null => {
    if (!classificationResult) return null
    return Object.entries(classificationResult).reduce((a, b) => 
      a[1] > b[1] ? a : b
    )[0]
  }

  // Get mock recommendations based on dominant type
  const getRecommendations = () => {
    const dominantType = getDominantType()
    return dominantType ? recommendationDatabase[dominantType as keyof typeof recommendationDatabase] : null
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>AI Hair Analysis System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Image Upload Section */}
            <div className="flex flex-col items-center space-y-4">
              {selectedImage ? (
                <div className="relative w-64 h-64">
                  <img
                    src={selectedImage}
                    alt="Uploaded hair"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <Button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-2 right-2"
                    variant="destructive"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="w-64 h-64 border-2 border-dashed rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-1 text-sm text-gray-600">Upload your hair image</p>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-4">
                <Button
                  onClick={() => document.getElementById('imageInput')?.click()}
                  variant="outline"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
                <Button
                  onClick={() => setIsCameraOpen(true)}
                  variant="outline"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
              </div>
              <input
                id="imageInput"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {error && (
              <div className="text-red-500 text-center">{error}</div>
            )}

            <Button
              onClick={handleAnalysis}
              disabled={!selectedImage || isAnalyzing}
              variant="outline"
              className="w-full"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Hair Type'}
            </Button>

            {/* Results Section */}
            {classificationResult && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Analysis Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(classificationResult).map(([type, probability]) => (
                        <div key={type} className="flex items-center">
                          <span className="w-24 capitalize">{type}</span>
                          <div className="flex-1 mx-4">
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div
                                className="h-2 bg-blue-600 rounded-full"
                                style={{ width: `${probability * 100}%` }}
                              />
                            </div>
                          </div>
                          <span className="w-16 text-right text-sm">
                            {(probability * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommended Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {getRecommendations() && Object.entries(getRecommendations()!).map(([category, product]) => (
                        <div key={category} className="flex justify-between items-center">
                          <span className="font-medium capitalize">{category}:</span>
                          <span>{product}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Camera Dialog */}
      <CameraDialog 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  )
}

export default HairAnalysisSystem