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
    return safe ? 'text-green-600' : 'text-custom-pink'
  }

  const getSafetyMessage = () => {
    return safe 
      ? 'This product appears to be safe for your skin!'
      : `Found ${harmful_count} potentially harmful ingredient(s)`
  }

  return (
    <div className="min-h-screen bg-custom-yellow p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-quicksand text-5xl font-bold text-custom-pink uppercase tracking-wider mb-4">
            Analysis Results
          </h1>
          <p className="font-quicksand text-xl text-custom-pink">
            Safety assessment for your skincare product
          </p>
        </div>

        {/* Product Info */}
        {productInfo && (
          <div className="bg-white rounded-3xl p-6 mb-8 border-4 border-custom-pink shadow-2xl">
            <div className="flex items-center space-x-6">
              {productInfo.image && (
                <img 
                  src={productInfo.image} 
                  alt={productInfo.title}
                  className="w-24 h-24 object-cover rounded-2xl border-2 border-custom-yellow"
                />
              )}
              <div>
                <h2 className="font-quicksand text-2xl font-bold text-custom-pink uppercase tracking-wider">
                  {productInfo.title}
                </h2>
                <p className="font-quicksand text-lg text-custom-pink">{productInfo.brand}</p>
              </div>
            </div>
          </div>
        )}

        {/* Safety Verdict */}
        <div className="bg-white rounded-3xl p-8 mb-8 border-4 border-custom-pink shadow-2xl">
          <div className="text-center">
            <h2 className={`font-quicksand text-4xl font-bold mb-4 uppercase tracking-wider ${getSafetyColor()}`}>
              {safe ? 'SAFE' : 'CAUTION'}
            </h2>
            <p className="font-quicksand text-xl text-custom-pink mb-4">
              {getSafetyMessage()}
            </p>
            <div className="font-quicksand text-lg text-custom-pink">
              Analyzed {total_ingredients_checked} ingredients
            </div>
            {/* Personalized Score */}
            {typeof personalized_score !== 'undefined' && (
              <div className="mt-6">
                <div className="font-quicksand text-3xl font-bold text-custom-blue">
                  Personalized Score: <span className="text-custom-pink">{personalized_score} / 100</span> ({score_category})
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Harmful Ingredients Breakdown */}
        {!safe && harmful_ingredients && Object.keys(harmful_ingredients).length > 0 && (
          <div className="bg-white rounded-3xl p-8 mb-8 border-4 border-custom-pink shadow-2xl">
            <h3 className="font-quicksand text-3xl font-bold text-custom-pink uppercase tracking-wider mb-6 text-center">
              Harmful Ingredients Found
            </h3>
            
            <div className="space-y-6">
              {Object.entries(harmful_ingredients).map(([category, data]) => (
                <div key={category} className="border-2 border-custom-pink rounded-2xl p-6 bg-red-50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-quicksand font-bold text-xl text-custom-pink uppercase tracking-wider">
                      {category.replace('_', ' ')}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 text-sm rounded-full font-quicksand font-bold ${
                        data.severity === 'CRITICAL' ? 'bg-red-200 text-red-800' :
                        data.severity === 'HIGH' ? 'bg-orange-200 text-orange-800' :
                        data.severity === 'MODERATE' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-blue-200 text-blue-800'
                      }`}>
                        {data.severity}
                      </span>
                    </div>
                  </div>
                  <p className="font-quicksand text-lg text-custom-pink mb-4">
                    {data.description}
                  </p>
                  <div className="space-y-2">
                    {data.ingredients.map((ingredient, index) => (
                      <div key={index} className="font-quicksand text-lg text-custom-pink font-bold">
                        • {ingredient}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Severity Summary */}
            <div className="mt-8 p-6 bg-custom-yellow rounded-2xl border-2 border-custom-pink">
              <h4 className="font-quicksand text-2xl font-bold text-custom-pink uppercase tracking-wider mb-4 text-center">
                Severity Breakdown
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                      <div className={`inline-block px-3 py-2 rounded-full text-sm font-quicksand font-bold ${
                        severity === 'CRITICAL' ? 'bg-red-200 text-red-800' :
                        severity === 'HIGH' ? 'bg-orange-200 text-orange-800' :
                        severity === 'MODERATE' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-blue-200 text-blue-800'
                      }`}>
                        {severity}
                      </div>
                      <div className="font-quicksand text-lg text-white mt-2 font-bold">{count} ingredients</div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Ingredients List */}
        {ingredientsAnalyzed && ingredientsAnalyzed.length > 0 && (
          <div className="bg-white rounded-3xl p-8 mb-8 border-4 border-custom-pink shadow-2xl">
            <h3 className="font-quicksand text-3xl font-bold text-blue-800 uppercase tracking-wider mb-6 text-center">
              All Ingredients Analyzed
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ingredientsAnalyzed.map((ingredient, index) => {
                const isHarmful = Object.values(harmful_ingredients || {}).some(
                  category => category.ingredients.includes(ingredient)
                )
                
                return (
                  <div 
                    key={index} 
                    className={`font-quicksand text-lg p-3 rounded-xl border-2 font-bold ${
                      isHarmful 
                        ? 'bg-red-100 text-custom-pink border-custom-pink' 
                        : 'bg-green-100 text-custom-blue border-custom-blue'
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
          <div className="bg-white rounded-3xl p-8 mb-8 border-4 border-custom-pink shadow-2xl">
            <div className="flex items-center mb-6">
              <h3 className="font-quicksand text-3xl font-bold text-custom-pink uppercase tracking-wider">
                Personalized Recommendations
              </h3>
            </div>
            
            {/* Products Section */}
            {recommendations.products && recommendations.products.length > 0 && (
              <div className="mb-8">
                <h4 className="font-quicksand text-2xl font-bold text-custom-blue uppercase tracking-wider mb-4">
                  Recommended Products
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.products.map((product, idx) => (
                    <div key={idx} className="bg-custom-yellow border-2 border-custom-pink rounded-2xl p-4">
                      <div className="font-quicksand text-lg text-white font-bold">{product}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips Section */}
            {recommendations.tips && recommendations.tips.length > 0 && (
              <div className="mb-8">
                <h4 className="font-quicksand text-2xl font-bold text-custom-blue uppercase tracking-wider mb-4">
                  Skincare Tips
                </h4>
                <div className="space-y-3">
                  {recommendations.tips.map((tip, idx) => (
                    <div key={idx} className="bg-custom-yellow border-2 border-custom-pink rounded-2xl p-4">
                      <div className="font-quicksand text-lg text-custom-pink">{tip}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ingredients to Avoid */}
            {recommendations.avoid_ingredients && recommendations.avoid_ingredients.length > 0 && (
              <div className="mb-8">
                <h4 className="font-quicksand text-2xl font-bold text-custom-pink uppercase tracking-wider mb-4">
                  Ingredients to Avoid
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {recommendations.avoid_ingredients.map((ingredient, idx) => (
                    <div key={idx} className="bg-red-50 border-2 border-custom-pink rounded-2xl p-3">
                      <div className="font-quicksand text-lg text-custom-pink font-bold">{ingredient}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ingredients to Look For */}
            {recommendations.look_for_ingredients && recommendations.look_for_ingredients.length > 0 && (
              <div className="mb-8">
                <h4 className="font-quicksand text-2xl font-bold text-custom-blue uppercase tracking-wider mb-4">
                  Ingredients to Look For
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {recommendations.look_for_ingredients.map((ingredient, idx) => (
                    <div key={idx} className="bg-green-50 border-2 border-custom-blue rounded-2xl p-3">
                      <div className="font-quicksand text-lg text-custom-blue font-bold">{ingredient}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback for old format */}
            {recommendations.description && !recommendations.products && !recommendations.tips && (
              <div className="bg-custom-yellow border-2 border-custom-pink rounded-2xl p-6">
                <p className="font-quicksand text-lg text-white">{recommendations.description}</p>
              </div>
            )}

            {/* No recommendations content */}
            {(!recommendations.products || recommendations.products.length === 0) && 
             (!recommendations.tips || recommendations.tips.length === 0) && 
             (!recommendations.avoid_ingredients || recommendations.avoid_ingredients.length === 0) && 
             (!recommendations.look_for_ingredients || recommendations.look_for_ingredients.length === 0) && 
             !recommendations.description && (
              <div className="bg-custom-yellow border-2 border-custom-pink rounded-2xl p-6">
                <p className="font-quicksand text-lg text-white">
                  <span className="font-bold text-custom-pink">Note:</span> No specific recommendations available for your profile. 
                  Try scanning a product with different ingredients or check back later for updated recommendations.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* No User Profile - Show basic message */
          <div className="bg-white rounded-3xl p-8 mb-8 border-4 border-custom-pink shadow-2xl">
            <div className="flex items-center mb-6">
              <h3 className="font-quicksand text-3xl font-bold text-custom-blue uppercase tracking-wider">
                Recommendations
              </h3>
              <span className="ml-4 px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full font-quicksand font-bold border-2 border-gray-300">
                Basic
              </span>
            </div>
            <div className="bg-custom-yellow border-2 border-custom-pink rounded-2xl p-6">
              <p className="font-quicksand text-lg text-white">
                <span className="font-bold text-custom-pink">Tip:</span> Create a user profile to get personalized recommendations! 
                Go to your profile page to set up your age, gender, and skin type for customized advice.
              </p>
            </div>
          </div>
        )}

        {/* Product Recommendations Section */}
        {analysis.product_recommendations && analysis.product_recommendations.length > 0 && (
          <div className="bg-white rounded-3xl p-8 mb-8 border-4 border-custom-pink shadow-2xl">
            <div className="flex items-center mb-6">
              <h3 className="font-quicksand text-3xl font-bold text-custom-pink uppercase tracking-wider">
                Better Alternatives
              </h3>
            </div>
            <p className="font-quicksand text-xl text-white mb-6">
              Based on your profile and the current product, here are some better alternatives:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analysis.product_recommendations.map((product, idx) => (
                <div key={idx} className="border-2 border-custom-pink rounded-2xl p-6 hover:shadow-xl transition-shadow bg-white">
                  {product.link ? (
                    <a 
                      href={product.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block hover:bg-custom-yellow rounded-2xl p-2 -m-2 transition-colors"
                    >
                      <div className="flex space-x-4">
                        {product.image && (
                          <img 
                            src={product.image} 
                            alt={product.title}
                            className="w-20 h-20 object-cover rounded-xl flex-shrink-0 border-2 border-custom-yellow"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-quicksand font-bold text-custom-pink text-lg mb-2 line-clamp-2 hover:text-custom-blue transition-colors">
                            {product.title}
                          </h4>
                          <div className="text-green-600 font-quicksand font-bold text-lg mb-2">
                            {product.price}
                          </div>
                          <div className="flex items-center space-x-3 text-sm text-custom-blue mb-2">
                            {product.rating !== 'No rating' && (
                              <span className="flex items-center font-quicksand font-bold">
                                {product.rating}
                              </span>
                            )}
                            {product.reviews !== 'No reviews' && (
                              <span className="font-quicksand">({product.reviews} reviews)</span>
                            )}
                          </div>
                          <div className="text-sm text-custom-blue mb-2 font-quicksand">
                            Sold by: {product.source}
                          </div>
                          <div className="inline-flex items-center text-custom-pink text-sm font-quicksand font-bold">
                            View Product
                            <span className="ml-1 text-xs">→</span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ) : (
                    <div className="flex space-x-4">
                      {product.image && (
                        <img 
                          src={product.image} 
                          alt={product.title}
                          className="w-20 h-20 object-cover rounded-xl flex-shrink-0 border-2 border-custom-yellow"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-quicksand font-bold text-custom-pink text-lg mb-2 line-clamp-2">
                          {product.title}
                        </h4>
                        <div className="text-green-600 font-quicksand font-bold text-lg mb-2">
                          {product.price}
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-custom-blue mb-2">
                          {product.rating !== 'No rating' && (
                            <span className="flex items-center font-quicksand font-bold">
                              {product.rating}
                            </span>
                          )}
                          {product.reviews !== 'No reviews' && (
                            <span className="font-quicksand">({product.reviews} reviews)</span>
                          )}
                        </div>
                        <div className="text-sm text-custom-blue mb-2 font-quicksand">
                          Sold by: {product.source}
                        </div>
                        <div className="text-sm text-gray-400 font-quicksand">
                          Link not available
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-custom-yellow border-2 border-custom-pink rounded-2xl">
              <p className="font-quicksand text-lg text-custom-pink">
                <span className="font-bold text-custom-pink">Note:</span> These recommendations are based on your profile and current product analysis. 
                Always read ingredient lists and reviews before purchasing.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-6 mb-8">
          <button
            onClick={() => navigate('/')}
            className="font-quicksand font-bold text-2xl text-white bg-custom-pink rounded-2xl p-4 border-b-4 border-pink-400 transition-all duration-150 uppercase tracking-wider hover:bg-pink-400 active:scale-95 active:border-b-0"
          >
            Scan Another Product
          </button>
          
          <button
            onClick={() => window.print()}
            className="font-quicksand font-bold text-2xl text-custom-pink bg-custom-yellow rounded-2xl p-4 border-b-4 border-amber-400 transition-all duration-150 uppercase tracking-wider hover:bg-amber-300 active:scale-95 active:border-b-0"
          >
            Print Results
          </button>
        </div>

        {/* Disclaimer */}
        <div className="text-center">
          <p className="font-quicksand text-lg text-custom-pink">
            <span className="font-bold">Disclaimer:</span> This analysis is for informational purposes only. 
            Always consult with a dermatologist for medical advice regarding skincare products.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Results 