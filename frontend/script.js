async function search() {
  const city = document.getElementById('cityInput').value.trim()
  const errorDiv = document.getElementById('error')
  const resultsDiv = document.getElementById('results')

  errorDiv.textContent = ''
  resultsDiv.innerHTML = ''

  if (!city) {
    errorDiv.textContent = 'Please enter a city.'
    return
  }

  try {
    const res = await fetch(`http://localhost:3001/api/restaurants?city=${encodeURIComponent(city)}`)
    const data = await res.json()

    if (!res.ok) {
      errorDiv.textContent = data.error
      return
    }

    if (data.length === 0) {
      errorDiv.textContent = 'No restaurants found for this city.'
      return
    }

    data.forEach(r => {
      const card = document.createElement('div')
      card.className = 'bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm'
      card.innerHTML = `
        <h3 class="text-lg font-semibold mb-1">${r.name}</h3>
        <p class="text-sm text-gray-500">rating: ${r.rating} (${r.review_count} reviews)</p>
        <p class="text-sm text-gray-500">address: ${r.location.display_address.join(', ')}</p>
        <p class="text-sm text-gray-500">coordinates: ${r.coordinates.latitude}, ${r.coordinates.longitude}</p>
      `
      resultsDiv.appendChild(card)
    })

  } catch (err) {
    errorDiv.textContent = 'Something went wrong. Please try again.'
  }
}