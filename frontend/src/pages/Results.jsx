import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const Results = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { analysis, productInfo, ingredientsAnalyzed } = location.state || {}

  // Debug logging
  console.log('Results component - analysis:', analysis)
  console.log('Results component - productInfo:', productInfo)
  console.log('Results component - serpapi_recommendations:', analysis?.serpapi_recommendations)
  
  // Additional debugging for SerpAPI recommendations
  if (analysis?.serpapi_recommendations) {
    console.log('🔍 SerpAPI recommendations details:')
    analysis.serpapi_recommendations.forEach((product, idx) => {
      console.log(`Product ${idx + 1}:`, {
        title: product.title,
        link: product.link,
        price: product.price,
        source: product.source
      })
    })
  }

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
            {productInfo.image ? (
              <img 
                src={productInfo.image} 
                alt={productInfo.title}
                className="w-20 h-20 object-cover rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
            ) : null}
            <div className={`w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center ${productInfo.image ? 'hidden' : 'block'}`}>
              <span className="text-gray-500 text-xs text-center">No Image</span>
            </div>
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
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-red-800 capitalize">
                    {category.replace('_', ' ')}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      data.severity === 'CRITICAL' ? 'bg-red-200 text-red-800' :
                      data.severity === 'HIGH' ? 'bg-orange-200 text-orange-800' :
                      data.severity === 'MODERATE' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>
                      {data.severity}
                    </span>
                  </div>
                </div>
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

          {/* Severity Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Severity Breakdown</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {(() => {
                const severityCounts = {
                  'CRITICAL': 0,
                  'HIGH': 0,
                  'MODERATE': 0,
                  'LOW': 0
                };
                
                Object.values(harmful_ingredients).forEach(data => {
                  const severity = data.severity || 'MODERATE';
                  severityCounts[severity] += data.ingredients.length;
                });

                return Object.entries(severityCounts).map(([severity, count]) => (
                  <div key={severity} className="text-center">
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      severity === 'CRITICAL' ? 'bg-red-200 text-red-800' :
                      severity === 'HIGH' ? 'bg-orange-200 text-orange-800' :
                      severity === 'MODERATE' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>
                      {severity}
                    </div>
                    <div className="text-gray-600 mt-1">{count} ingredients</div>
                  </div>
                ));
              })()}
            </div>
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
      {recommendations ? (
        <div className="card mb-6">
          <div className="flex items-center mb-4">
            <h3 className="text-xl font-semibold text-primary-700">
              💡 Personalized Recommendations
            </h3>
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {recommendations.products && recommendations.products.length > 0 ? 'AI Generated' : 'Basic'}
            </span>
          </div>
          
          {/* Products Section */}
          {recommendations.products && recommendations.products.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                🛍️ Recommended Products
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommendations.products.map((product, idx) => (
                  <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-green-800 font-medium">{product}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips Section */}
          {recommendations.tips && recommendations.tips.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                💡 Skincare Tips
              </h4>
              <div className="space-y-2">
                {recommendations.tips.map((tip, idx) => (
                  <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-blue-800">{tip}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ingredients to Avoid */}
          {recommendations.avoid_ingredients && recommendations.avoid_ingredients.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                ⚠️ Ingredients to Avoid
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {recommendations.avoid_ingredients.map((ingredient, idx) => (
                  <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-2">
                    <div className="text-red-800 text-sm">{ingredient}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ingredients to Look For */}
          {recommendations.look_for_ingredients && recommendations.look_for_ingredients.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                ✅ Ingredients to Look For
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {recommendations.look_for_ingredients.map((ingredient, idx) => (
                  <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-2">
                    <div className="text-green-800 text-sm">{ingredient}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback for old format */}
          {recommendations.description && !recommendations.products && !recommendations.tips && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700">{recommendations.description}</p>
            </div>
          )}

          {/* No recommendations content */}
          {(!recommendations.products || recommendations.products.length === 0) && 
           (!recommendations.tips || recommendations.tips.length === 0) && 
           (!recommendations.avoid_ingredients || recommendations.avoid_ingredients.length === 0) && 
           (!recommendations.look_for_ingredients || recommendations.look_for_ingredients.length === 0) && 
           !recommendations.description && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                <strong>Note:</strong> No specific recommendations available for your profile. 
                Try scanning a product with different ingredients or check back later for updated recommendations.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* No User Profile - Show basic message */
        <div className="card mb-6">
          <div className="flex items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-700">
              💡 Recommendations
            </h3>
            <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              Basic
            </span>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              <strong>Tip:</strong> Create a user profile to get personalized recommendations! 
              Go to your profile page to set up your age, gender, and skin type for customized advice.
            </p>
          </div>
        </div>
      )}

      {/* SerpAPI Product Recommendations */}
      {analysis.serpapi_recommendations && analysis.serpapi_recommendations.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center mb-4">
            <h3 className="text-xl font-semibold text-green-700">
              🛒 Better Alternatives
            </h3>
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Live Search
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.serpapi_recommendations.map((product, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                {product.link ? (
                  <a 
                    href={product.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start space-x-3">
                      {product.image && (
                        <img 
                          src={product.image} 
                          alt={product.title}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 text-sm mb-1 line-clamp-2 hover:text-blue-600 transition-colors">
                          {product.title}
                        </h4>
                        
                        {product.price && (
                          <div className="text-green-600 font-semibold text-sm mb-1">
                            {product.price}
                          </div>
                        )}
                        
                        {product.rating && (
                          <div className="flex items-center space-x-1 mb-2">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={i < Math.floor(parseFloat(product.rating)) ? 'text-yellow-400' : 'text-gray-300'}>
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="text-gray-600 text-xs">
                              {product.rating} {product.reviews && `(${product.reviews})`}
                            </span>
                          </div>
                        )}
                        
                        {product.source && (
                          <div className="text-gray-500 text-xs mb-2">
                            Available at: {product.source}
                          </div>
                        )}
                        
                        {product.link && (
                          <div className="inline-block bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700 transition-colors">
                            {product.link.includes('google.com/shopping') ? 'View on Google Shopping →' : 'View Product →'}
                          </div>
                        )}
                      </div>
                    </div>
                  </a>
                ) : (
                  <div className="flex items-start space-x-3">
                    {product.image && (
                      <img 
                        src={product.image} 
                        alt={product.title}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 text-sm mb-1 line-clamp-2">
                        {product.title}
                      </h4>
                      
                      {product.price && (
                        <div className="text-green-600 font-semibold text-sm mb-1">
                          {product.price}
                        </div>
                      )}
                      
                      {product.rating && (
                        <div className="flex items-center space-x-1 mb-2">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < Math.floor(parseFloat(product.rating)) ? 'text-yellow-400' : 'text-gray-300'}>
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-gray-600 text-xs">
                            {product.rating} {product.reviews && `(${product.reviews})`}
                          </span>
                        </div>
                      )}
                      
                      {product.source && (
                        <div className="text-gray-500 text-xs mb-2">
                          Available at: {product.source}
                        </div>
                      )}
                      
                      <div className="text-gray-400 text-xs px-3 py-1 rounded bg-gray-100">
                        Link not available
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-xs text-gray-500 text-center">
            Product recommendations are based on your profile and current product analysis. 
            Prices and availability may vary.
          </div>
        </div>
      )}

      {/* Debug info for SerpAPI recommendations */}
      {productInfo && !analysis.serpapi_recommendations && (
        <div className="card mb-6">
          <div className="flex items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-700">
              🛒 Product Recommendations
            </h3>
            <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              Loading...
            </span>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              <strong>Note:</strong> Product recommendations are being loaded. This may take a few moments.
              If recommendations don't appear, try refreshing the page or scanning again.
            </p>
          </div>
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