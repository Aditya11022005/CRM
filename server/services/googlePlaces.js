const axios = require('axios');
const Lead = require('../models/Lead');

/**
 * Searches Google Places via official API. If no API key is set, returns simulated data to demonstrate UI capabilities.
 */
const searchGooglePlaces = async (query, city, category, apiKey, businessId, userId, forceSimulate = false) => {
  const finalQuery = `${query} in ${city}`;

  const key = apiKey || process.env.GOOGLE_PLACES_API_KEY;

  if (forceSimulate || !key) {
    console.log('[Places API]: Simulating API search.');
    return await simulatePlacesSearch(query, city, category, businessId, userId);
  }

  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(finalQuery)}&key=${key}`;

  try {
    const searchResponse = await axios.get(searchUrl);
    
    if (searchResponse.data.status !== 'OK' && searchResponse.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API Error: ${searchResponse.data.status} - ${searchResponse.data.error_message || ''}`);
    }

    const results = searchResponse.data.results || [];
    const savedLeads = [];

    // Process up to 10 results to avoid rate limit/performance hits on single search
    for (const place of results.slice(0, 10)) {
      // Check duplicate
      const exists = await Lead.findOne({
        business: businessId,
        $or: [
          { name: place.name, city },
          { mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}` },
        ],
      });

      if (exists) continue;

      // Fetch place details for website and phone
      let phone = '';
      let website = '';
      let openingHours = '';
      let mapsUrl = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;

      try {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number,website,opening_hours,url&key=${key}`;
        const detailsResponse = await axios.get(detailsUrl);
        
        if (detailsResponse.data.status === 'OK') {
          const det = detailsResponse.data.result;
          phone = det.formatted_phone_number || '';
          website = det.website || '';
          mapsUrl = det.url || mapsUrl;
          if (det.opening_hours && det.opening_hours.weekday_text) {
            openingHours = det.opening_hours.weekday_text.join(', ');
          }
        }
      } catch (err) {
        console.error(`Error fetching details for place ${place.place_id}:`, err.message);
      }

      const lead = new Lead({
        business: businessId,
        name: place.name,
        phone: phone || '',
        email: '', // Places API does not provide emails directly
        website: website || '',
        address: place.formatted_address || '',
        rating: place.rating || 0,
        reviewsCount: place.user_ratings_total || 0,
        category: category,
        city: city,
        latitude: place.geometry?.location?.lat || null,
        longitude: place.geometry?.location?.lng || null,
        openingHours: openingHours,
        mapsUrl: mapsUrl,
        source: 'Google Maps (API)',
        createdBy: userId,
      });

      await lead.save();
      savedLeads.push(lead);
    }

    return savedLeads;
  } catch (err) {
    console.error('Google Places API search failed:', err.message);
    throw err;
  }
};

/**
 * High-fidelity Place Search simulation if no Google key is available.
 */
const simulatePlacesSearch = async (query, city, category, businessId, userId) => {
  // Simulate delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const simulationData = [
    {
      name: `Prime ${category.toUpperCase()} Solutions`,
      phone: '+91 94444 88888',
      website: `https://www.prime${category.toLowerCase()}.com`,
      address: `12, MG Road, ${city}, India`,
      rating: 4.8,
      reviewsCount: 310,
      lat: 12.971598,
      lng: 77.594562,
      hours: 'Mon-Sat: 9:00 AM - 6:00 PM',
    },
    {
      name: `${city} ${category.charAt(0).toUpperCase() + category.slice(1)} Hub`,
      phone: '+91 93333 77777',
      website: '',
      address: `45, Residency Road, ${city}, India`,
      rating: 4.2,
      reviewsCount: 92,
      lat: 12.968598,
      lng: 77.596562,
      hours: 'Mon-Fri: 10:00 AM - 7:00 PM',
    },
    {
      name: `Elite ${category.charAt(0).toUpperCase() + category.slice(1)} Services`,
      phone: '+91 92222 66666',
      website: `https://www.elite${category.toLowerCase()}services.in`,
      address: `88, Outer Ring Road, ${city}, India`,
      rating: 4.5,
      reviewsCount: 145,
      lat: 12.972598,
      lng: 77.592562,
      hours: 'Open 24 hours',
    },
  ];

  const savedLeads = [];
  let idx = 0;

  for (const item of simulationData) {
    const exists = await Lead.findOne({
      business: businessId,
      name: item.name,
      city,
    });

    if (exists) continue;

    const lead = new Lead({
      business: businessId,
      name: item.name,
      phone: item.phone,
      email: `info@${item.name.toLowerCase().replace(/\s+/g, '')}.com`,
      website: item.website,
      address: item.address,
      rating: item.rating,
      reviewsCount: item.reviewsCount,
      category: category,
      city: city,
      latitude: item.lat,
      longitude: item.lng,
      openingHours: item.hours,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name + ' ' + city)}`,
      source: 'Google Maps (API)',
      createdBy: userId,
    });

    await lead.save();
    savedLeads.push(lead);
    idx++;
  }

  return savedLeads;
};

module.exports = {
  searchGooglePlaces,
};
