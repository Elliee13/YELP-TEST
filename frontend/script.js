const state = {
  restaurants: [],
  lastTrigger: null,
  selectedRestaurant: null,
  favorites: new Set()
}

const searchForm = document.getElementById('searchForm')
const cityInput = document.getElementById('cityInput')
const searchButton = document.getElementById('searchButton')
const statusBox = document.getElementById('status')
const resultsBox = document.getElementById('results')
const resultsTitle = document.getElementById('resultsTitle')
const browseView = document.getElementById('browseView')
const detailView = document.getElementById('detailView')
const detailModal = document.querySelector('.detail-page-shell')
const closeModalButton = document.getElementById('closeModal')
const detailImage = document.getElementById('detailImage')
const detailOpenBadge = document.getElementById('detailOpenBadge')
const detailMeta = document.getElementById('detailMeta')
const detailTitle = document.getElementById('detailTitle')
const detailHeroTags = document.getElementById('detailHeroTags')
const detailDescription = document.getElementById('detailDescription')
const detailWishButton = document.querySelector('.detail-content .wish-button')
const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:3001'

searchForm.addEventListener('submit', search)
closeModalButton.addEventListener('click', closeModal)
detailWishButton.addEventListener('click', () => {
  if (!state.selectedRestaurant) {
    return
  }

  toggleFavorite(state.selectedRestaurant)
  setFavoriteButtonState(detailWishButton, state.selectedRestaurant)
  renderResults()
})

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !detailView.classList.contains('hidden')) {
    closeModal()
  }
})

function setStatus(message = '', tone = '') {
  if (!message) {
    statusBox.textContent = ''
    statusBox.className = 'status hidden'
    return
  }

  statusBox.textContent = message
  statusBox.className = `status ${tone}`.trim()
}

function formatAddress(location) {
  if (Array.isArray(location?.display_address) && location.display_address.length > 0) {
    return location.display_address.join(', ')
  }

  return 'Not available'
}

function formatCoordinates(coordinates) {
  const latitude = coordinates?.latitude
  const longitude = coordinates?.longitude

  if (typeof latitude === 'number' && typeof longitude === 'number') {
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
  }

  return 'Not available'
}

function formatCategories(categories) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return []
  }

  return categories
    .map(category => category?.title)
    .filter(Boolean)
}

function formatDistance(distance) {
  if (typeof distance !== 'number') {
    return 'Not available'
  }

  return `${(distance / 1609.34).toFixed(1)} mi away`
}

function buildRestaurantSummary(restaurant) {
  const parts = []
  const categories = formatCategories(restaurant.categories)
  const city = restaurant.location?.city
  const reviewCount = restaurant.review_count
  const distance = formatDistance(restaurant.distance)

  if (categories.length > 0) {
    parts.push(categories.slice(0, 2).join(', '))
  }

  if (city) {
    parts.push(`in ${city}`)
  }

  if (typeof restaurant.rating === 'number') {
    let ratingText = `rated ${restaurant.rating.toFixed(1)}`

    if (typeof reviewCount === 'number') {
      ratingText += ` from ${reviewCount} review${reviewCount === 1 ? '' : 's'}`
    }

    parts.push(ratingText)
  }

  if (distance !== 'Not available') {
    parts.push(distance)
  }

  if (restaurant.price) {
    parts.push(`${restaurant.price} price level`)
  }

  if (parts.length === 0) {
    return 'Restaurant details available below.'
  }

  const summary = parts.join(' | ')
  return summary.charAt(0).toUpperCase() + summary.slice(1) + '.'
}

function getRestaurantKey(restaurant) {
  if (restaurant?.id) {
    return restaurant.id
  }

  return [restaurant?.name, formatAddress(restaurant?.location)].join('::')
}

function isFavorite(restaurant) {
  return state.favorites.has(getRestaurantKey(restaurant))
}

function toggleFavorite(restaurant) {
  const key = getRestaurantKey(restaurant)

  if (state.favorites.has(key)) {
    state.favorites.delete(key)
    return
  }

  state.favorites.add(key)
}

function getOpenState(restaurant) {
  if (typeof restaurant?.is_closed !== 'boolean') {
    return { label: 'Hours unavailable', className: '' }
  }

  return restaurant.is_closed
    ? { label: 'Closed now', className: 'closed' }
    : { label: 'Open now', className: 'open' }
}

function createImageOrFallback(url, alt, className = 'image-fallback') {
  if (!url) {
    const placeholder = document.createElement('div')
    placeholder.className = className
    placeholder.textContent = 'No image available'
    return placeholder
  }

  const image = document.createElement('img')
  image.src = url
  image.alt = alt
  return image
}

function createChip(text, className = 'detail-chip') {
  const chip = document.createElement('span')
  chip.className = className
  chip.textContent = text
  return chip
}

function setFavoriteButtonState(button, restaurant) {
  const favorite = isFavorite(restaurant)
  button.classList.toggle('is-favorite', favorite)
  button.setAttribute('aria-pressed', favorite ? 'true' : 'false')
  button.setAttribute('aria-label', favorite ? 'Remove saved restaurant' : 'Save restaurant')
  button.innerHTML = favorite ? '&#9829;' : '&#9825;'
}

function buildMetaItem(icon, text, extraClass = '') {
  const item = document.createElement('span')
  item.className = `meta-item ${extraClass}`.trim()
  item.innerHTML = `<span>${icon}</span><span>${text}</span>`
  return item
}

function createCard(restaurant) {
  const card = document.createElement('button')
  card.type = 'button'
  card.className = 'product-card'
  card.setAttribute('aria-label', `View details for ${restaurant.name || 'restaurant'}`)
  card.addEventListener('click', event => openModal(restaurant, event.currentTarget))

  const imageBox = document.createElement('div')
  imageBox.className = 'card-image'
  imageBox.appendChild(createImageOrFallback(restaurant.image_url, `${restaurant.name || 'Restaurant'} photo`))

  const openState = getOpenState(restaurant)
  if (openState.className) {
    const badge = document.createElement('span')
    badge.className = `card-badge ${openState.className}`
    badge.textContent = openState.label
    imageBox.appendChild(badge)
  }

  const action = document.createElement('span')
  action.className = 'card-action'
  action.innerHTML = '<span>See details</span><span class="card-action-icon">&#8599;</span>'
  imageBox.appendChild(action)

  const content = document.createElement('div')
  content.className = 'product-content'

  const heading = document.createElement('div')
  heading.className = 'product-heading'

  const title = document.createElement('h3')
  title.className = 'product-name'
  title.textContent = restaurant.name || 'Unnamed restaurant'

  const saveButton = document.createElement('button')
  saveButton.type = 'button'
  saveButton.className = 'wish-button'
  saveButton.addEventListener('click', event => {
    event.stopPropagation()
    toggleFavorite(restaurant)
    setFavoriteButtonState(saveButton, restaurant)

    if (state.selectedRestaurant && getRestaurantKey(state.selectedRestaurant) === getRestaurantKey(restaurant)) {
      setFavoriteButtonState(detailWishButton, restaurant)
    }
  })
  setFavoriteButtonState(saveButton, restaurant)

  heading.append(title, saveButton)

  const meta = document.createElement('div')
  meta.className = 'product-meta'
  meta.append(
    buildMetaItem('&#128205;', restaurant.location?.city || 'Location unavailable'),
    buildMetaItem('<span class="star">&#9733;</span>', `${restaurant.rating ?? 'N/A'}${restaurant.review_count != null ? ` (${restaurant.review_count} reviews)` : ''}`)
  )

  const text = document.createElement('p')
  text.className = 'product-text'
  text.textContent = formatAddress(restaurant.location)

  const coordinates = document.createElement('p')
  coordinates.className = 'product-text product-coordinates'
  coordinates.textContent = `Coordinates: ${formatCoordinates(restaurant.coordinates)}`

  const chips = document.createElement('div')
  chips.className = 'chip-row'

  const categoryNames = formatCategories(restaurant.categories)
  categoryNames.slice(0, 3).forEach(category => {
    chips.appendChild(createChip(category, 'hero-chip'))
  })

  if (restaurant.price) {
    chips.appendChild(createChip(restaurant.price, 'hero-chip'))
  }

  content.append(heading, meta, text, coordinates)

  if (chips.childElementCount > 0) {
    content.appendChild(chips)
  }

  card.append(imageBox, content)
  return card
}

function renderResults() {
  resultsBox.innerHTML = ''

  if (state.restaurants.length === 0) {
    return
  }

  const fragment = document.createDocumentFragment()
  state.restaurants.forEach(restaurant => {
    fragment.appendChild(createCard(restaurant))
  })

  resultsBox.appendChild(fragment)
}

function openModal(restaurant, trigger) {
  state.lastTrigger = trigger
  state.selectedRestaurant = restaurant

  detailImage.innerHTML = ''
  detailOpenBadge.textContent = ''
  detailOpenBadge.className = 'detail-badge hidden'
  detailMeta.innerHTML = ''
  detailHeroTags.innerHTML = ''

  detailImage.appendChild(createImageOrFallback(restaurant.image_url, `${restaurant.name || 'Restaurant'} photo`))
  detailTitle.textContent = restaurant.name || 'Unnamed restaurant'

  const openState = getOpenState(restaurant)
  if (openState.className) {
    detailOpenBadge.textContent = openState.label
    detailOpenBadge.className = `detail-badge ${openState.className}`
  }

  detailMeta.append(
    buildMetaItem('&#128205;', restaurant.location?.city || 'Location unavailable'),
    buildMetaItem('&#128205;', formatAddress(restaurant.location)),
    buildMetaItem('&#9906;', formatCoordinates(restaurant.coordinates)),
    buildMetaItem('<span class="star">&#9733;</span>', `${restaurant.rating ?? 'N/A'}${restaurant.review_count != null ? ` (${restaurant.review_count} reviews)` : ''}`),
    buildMetaItem('&#128222;', restaurant.display_phone || restaurant.phone || 'Phone unavailable')
  )

  const categoryNames = formatCategories(restaurant.categories)
  categoryNames.slice(0, 3).forEach(category => {
    detailHeroTags.appendChild(createChip(category))
  })

  if (restaurant.price) {
    detailHeroTags.appendChild(createChip(restaurant.price))
  }

  detailDescription.textContent = buildRestaurantSummary(restaurant)
  setFavoriteButtonState(detailWishButton, restaurant)

  browseView.classList.add('hidden')
  detailView.classList.remove('hidden')
  window.scrollTo(0, 0)
  detailModal.focus()
}

function closeModal() {
  detailView.classList.add('hidden')
  browseView.classList.remove('hidden')
  state.selectedRestaurant = null

  if (state.lastTrigger instanceof HTMLElement) {
    state.lastTrigger.focus()
  }
}

function scrollToResults() {
  resultsTitle?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function search(event) {
  if (event) {
    event.preventDefault()
  }

  const city = cityInput.value.trim()
  resultsBox.innerHTML = ''
  closeModal()

  if (!city) {
    state.restaurants = []
    setStatus('Please enter a city.', 'error')
    return
  }

  setStatus(`Searching Yelp for restaurants in ${city}...`)
  searchButton.disabled = true
  searchButton.textContent = 'Searching...'

  try {
    const res = await fetch(`${API_BASE_URL}/api/restaurants?city=${encodeURIComponent(city)}`)
    const data = await res.json()

    if (!res.ok) {
      setStatus(data.error || 'Something went wrong. Please try again.', 'error')
      state.restaurants = []
      return
    }

    state.restaurants = Array.isArray(data) ? data : []

    if (state.restaurants.length === 0) {
      setStatus('No restaurants found for this city.')
      scrollToResults()
      return
    }

    setStatus('')
    renderResults()
    scrollToResults()
  } catch (error) {
    state.restaurants = []
    setStatus('Something went wrong. Please try again.', 'error')
    scrollToResults()
  } finally {
    searchButton.disabled = false
    searchButton.textContent = 'Search'
  }
}
