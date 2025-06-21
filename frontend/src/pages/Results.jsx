import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const Results = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { analysis, productInfo, ingredientsAnalyzed } = location.state || {}

  // If no analysis data, redirect to home
  if (!analysis) {
    React.useEffect(() => {
      navigate('/')
    }, [navigate])
    return null
  }

  const { safe, harmful_count, harmful_ingredients, total_ingredients_checked, personalized_score, score_category, recommendations } = analysis

  const getSafetyColor = () => {
    return safe ? 'text-success-600' : 'text-danger-600'
  }

  const getSafetyIcon = () => {
    return safe ? '✅' : '⚠️'
  }

  const getSafetyMessage = () => {
    return safe 
      ? 'This product appears to be safe for your skin!'
      : `Found ${harmful_count} potentially harmful ingredient(s)`
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Analysis Results
        </h1>
        <p className="text-gray-600">
          Safety assessment for your skincare product
        </p>
      </div>

      {/* Product Info */}
      {productInfo && (
        <div className="card mb-6">
          <div className="flex items-center space-x-4">
            {productInfo.image && (
              <img 
                src={productInfo.image} 
                alt={productInfo.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {productInfo.title}
              </h2>
              <p className="text-gray-600">{productInfo.brand}</p>
            </div>
          </div>
        </div>
      )}

      {/* Safety Verdict */}
      <div className="card mb-6">
        <div className="text-center">
          <div className="text-6xl mb-4">{getSafetyIcon()}</div>
          <h2 className={`text-2xl font-bold mb-2 ${getSafetyColor()}`}>
            {safe ? 'SAFE' : 'CAUTION'}
          </h2>
          <p className="text-lg text-gray-700 mb-4">
            {getSafetyMessage()}
          </p>
          <div className="text-sm text-gray-500">
            Analyzed {total_ingredients_checked} ingredients
          </div>
          {/* Personalized Score */}
          {typeof personalized_score !== 'undefined' && (
            <div className="mt-4">
              <div className="text-lg font-semibold">
                Personalized Score: <span className="text-primary-600">{personalized_score} / 100</span> ({score_category})
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Harmful Ingredients Breakdown */}
      {!safe && harmful_ingredients && Object.keys(harmful_ingredients).length > 0 && (
        <div className="card mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Harmful Ingredients Found
          </h3>
          
          <div className="space-y-4">
            {Object.entries(harmful_ingredients).map(([category, data]) => (
              <div key={category} className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h4 className="font-semibold text-red-800 capitalize mb-2">
                  {category.replace('_', ' ')}
                </h4>
                <p className="text-red-700 text-sm mb-3">
                  {data.description}
                </p>
                <div className="space-y-1">
                  {data.ingredients.map((ingredient, index) => (
                    <div key={index} className="text-red-800 text-sm">
                      • {ingredient}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ingredients List */}
      {ingredientsAnalyzed && ingredientsAnalyzed.length > 0 && (
        <div className="card mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            All Ingredients Analyzed
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {ingredientsAnalyzed.map((ingredient, index) => {
              const isHarmful = Object.values(harmful_ingredients || {}).some(
                category => category.ingredients.includes(ingredient)
              )
              
              return (
                <div 
                  key={index} 
                  className={`text-sm p-2 rounded ${
                    isHarmful 
                      ? 'bg-red-100 text-red-800 border border-red-200' 
                      : 'bg-green-100 text-green-800 border border-green-200'
                  }`}
                >
                  {ingredient}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Personalized Recommendations */}
      {recommendations && (
        <div className="card mb-6">
          <h3 className="text-xl font-semibold text-primary-700 mb-4">
            Personalized Recommendations
          </h3>
          {recommendations.description && (
            <p className="mb-2 text-gray-700">{recommendations.description}</p>
          )}
          {recommendations.products && recommendations.products.length > 0 && (
            <div className="mb-2">
              <div className="font-semibold mb-1">Recommended Products:</div>
              <ul className="list-disc list-inside text-gray-800">
                {recommendations.products.map((prod, idx) => (
                  <li key={idx}>{prod}</li>
                ))}
              </ul>
            </div>
          )}
          {recommendations.tips && recommendations.tips.length > 0 && (
            <div>
              <div className="font-semibold mb-1">Tips:</div>
              <ul className="list-disc list-inside text-gray-700">
                {recommendations.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="btn-primary"
        >
          🔍 Scan Another Product
        </button>
        
        <button
          onClick={() => window.print()}
          className="btn-secondary"
        >
          🖨️ Print Results
        </button>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 text-center text-xs text-gray-500">
        <p>
          ⚠️ Disclaimer: This analysis is for informational purposes only. 
          Always consult with a dermatologist for medical advice regarding skincare products.
        </p>
      </div>
    </div>
  )
}

export default Results 