const axios = require('axios');
const Lead = require('../models/Lead');
const { extractEmailFromWebsite, activeJobs, stopRequestsSet } = require('./scraper');

// Helper to send live logs via Socket.io
const logToSocket = (io, businessId, message, type = 'info', progress = 0) => {
  if (io) {
    io.to(businessId.toString()).emit('scraping_log', {
      message,
      type,
      progress,
      timestamp: new Date(),
    });
  }
  console.log(`[Places API - Business ${businessId}]: ${message}`);
};

/**
 * Searches Google Places via official API. If no API key is set, returns simulated data to demonstrate UI capabilities.
 */
const searchGooglePlaces = async (query, city, category, apiKey, businessId, userId, io, forceSimulate = false) => {
  const jobId = `${businessId}`;
  
  if (stopRequestsSet.has(jobId)) {
    throw new Error('Places search stopped by user');
  }
  activeJobs.set(jobId, { status: 'running', stopRequested: false });

  logToSocket(io, businessId, `Starting Google Places API campaign for: "${query}" in "${city}"...`, 'info', 5);

  const finalQuery = `${query} in ${city}`;
  const key = apiKey || process.env.GOOGLE_PLACES_API_KEY;

  if (forceSimulate || !key) {
    logToSocket(io, businessId, 'No API key provided or simulation selected. Starting simulator...', 'warning', 10);
    const leads = await simulatePlacesSearch(query, city, category, businessId, userId, io);
    activeJobs.delete(jobId);
    return leads;
  }

  let results = [];
  let nextPageToken = '';
  let pagesFetched = 0;
  const maxPages = 10;

  try {
    do {
      if (activeJobs.get(jobId)?.stopRequested) {
        throw new Error('Places search stopped by user');
      }

      let searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?key=${key}`;
      if (nextPageToken) {
        logToSocket(io, businessId, `Waiting for next page token to activate...`, 'info', 10 + pagesFetched * 5);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        searchUrl += `&pagetoken=${nextPageToken}`;
      } else {
        searchUrl += `&query=${encodeURIComponent(finalQuery)}`;
      }

      logToSocket(io, businessId, `Requesting Places API search page ${pagesFetched + 1}...`, 'info', 15 + pagesFetched * 5);
      const searchResponse = await axios.get(searchUrl);
      
      if (searchResponse.data.status !== 'OK' && searchResponse.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API Error: ${searchResponse.data.status} - ${searchResponse.data.error_message || ''}`);
      }

      const pageResults = searchResponse.data.results || [];
      results = results.concat(pageResults);
      logToSocket(io, businessId, `Fetched ${results.length} total raw place records.`, 'info', 20 + pagesFetched * 5);
      
      nextPageToken = searchResponse.data.next_page_token || '';
      pagesFetched++;
    } while (nextPageToken && results.length < 200 && pagesFetched < maxPages);

    logToSocket(io, businessId, `Places API search complete. Found ${results.length} candidates. Processing details & emails...`, 'info', 40);

    const savedLeads = [];
    const limitListings = results.slice(0, 200);
    const total = limitListings.length;
    let processed = 0;

    for (const place of limitListings) {
      if (activeJobs.get(jobId)?.stopRequested) {
        throw new Error('Places search stopped by user');
      }

      // Check duplicate
      const exists = await Lead.findOne({
        business: businessId,
        $or: [
          { name: place.name, city },
          { mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}` },
        ],
      });

      if (exists) {
        processed++;
        const pct = Math.round(40 + (processed / total) * 60);
        logToSocket(io, businessId, `Skipped duplicate: "${place.name}" (${processed}/${total})`, 'info', pct);
        continue;
      }

      // Fetch place details for website and phone
      let phone = '';
      let website = '';
      let email = '';
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

      // Try to extract email from the website if it exists
      if (website) {
        try {
          email = await extractEmailFromWebsite(website);
        } catch (err) {
          console.error(`Error extracting email for place ${place.name} from ${website}:`, err.message);
        }
      }

      const lead = new Lead({
        business: businessId,
        name: place.name,
        phone: phone || '',
        email: email || '',
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
      processed++;
      
      const pct = Math.round(40 + (processed / total) * 60);
      logToSocket(io, businessId, `Processed ${processed}/${total}: "${place.name}"`, 'success', pct);
    }

    logToSocket(io, businessId, `Google Places search complete! Saved ${savedLeads.length} new leads.`, 'success', 100);
    activeJobs.delete(jobId);
    return savedLeads;
  } catch (err) {
    logToSocket(io, businessId, `Places API search error: ${err.message}`, 'error', 100);
    activeJobs.delete(jobId);
    throw err;
  }
};

/**
 * High-fidelity Place Search simulation if no Google key is available.
 * Generates 200 detailed leads for realistic testing.
 */
const simulatePlacesSearch = async (query, city, category, businessId, userId, io) => {
  logToSocket(io, businessId, `Simulator: preparing simulated places search for "${query}" in "${city}"...`, 'info', 15);
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const savedLeads = [];
  const targetCount = 200;
  
  const companyPrefixes = ['Prime', 'Elite', 'Apex', 'Global', 'National', 'Metro', 'Summit', 'Direct', 'Vanguard', 'Alpha', 'Pro', 'Infinity', 'Omni', 'Dynamic', 'Nova'];
  const companySuffixes = ['Solutions', 'Services', 'Hub', 'Group', 'Partners', 'Systems', 'Ventures', 'Associates', 'Co', 'Industries'];

  for (let i = 1; i <= targetCount; i++) {
    if (activeJobs.get(`${businessId}`)?.stopRequested) {
      throw new Error('Places search stopped by user');
    }

    const pfx = companyPrefixes[i % companyPrefixes.length];
    const sfx = companySuffixes[(i + 3) % companySuffixes.length];
    const catName = category.charAt(0).toUpperCase() + category.slice(1);
    const companyName = `${pfx} ${catName} ${sfx} ${i}`;

    const exists = await Lead.findOne({
      business: businessId,
      name: companyName,
      city,
    });

    if (exists) {
      const pct = Math.round(15 + (i / targetCount) * 85);
      logToSocket(io, businessId, `Skipped duplicate: "${companyName}" (${i}/${targetCount})`, 'info', pct);
      continue;
    }

    const domain = `${pfx.toLowerCase()}-${catName.toLowerCase()}-${i}.in`;
    const rating = parseFloat((4.0 + Math.random() * 0.9).toFixed(1));
    const reviewsCount = Math.floor(15 + Math.random() * 450);
    const phone = `+91 ${90000 + (i % 10000)} ${10000 + (i % 90000)}`;

    const lead = new Lead({
      business: businessId,
      name: companyName,
      phone: phone,
      email: `contact@${domain}`,
      website: `https://www.${domain}`,
      address: `${100 + i}, Commercial Complex, Phase ${i % 5 + 1}, ${city}, India`,
      rating: rating,
      reviewsCount: reviewsCount,
      category: category,
      city: city,
      latitude: 12.971598 + (i * 0.0005),
      longitude: 77.594562 - (i * 0.0005),
      openingHours: 'Mon-Sat: 9:00 AM - 6:00 PM',
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(companyName + ' ' + city)}`,
      source: 'Google Maps (API)',
      createdBy: userId,
    });

    await lead.save();
    savedLeads.push(lead);
    
    // Slight delay to simulate progress logs filling up nicely
    await new Promise((resolve) => setTimeout(resolve, 20));
    
    const pct = Math.round(15 + (i / targetCount) * 85);
    logToSocket(io, businessId, `Saved simulated lead: "${companyName}" (${i}/${targetCount})`, 'success', pct);
  }

  logToSocket(io, businessId, `Places API simulation complete! Saved ${savedLeads.length} leads.`, 'success', 100);
  return savedLeads;
};

module.exports = {
  searchGooglePlaces,
};
