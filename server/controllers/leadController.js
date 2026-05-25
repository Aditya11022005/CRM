const Lead = require('../models/Lead');
const { searchGooglePlaces } = require('../services/googlePlaces');
const { scrapeGoogleMaps, scrapeJustdial, scrapeIndiaMart, scrapeYellowPages, requestStopJob, getJobStatus, clearStopRequest } = require('../services/scraper');
const { getIO } = require('../utils/socket');

/**
 * @desc    Get all leads for a business with query, category, city, rating filters
 * @route   GET /api/v1/leads
 * @access  Private (checked by checkBusinessAccess)
 */
exports.getLeads = async (req, res, next) => {
  try {
    const { category, city, rating, hasWebsite, hasPhone, isFavorite, status, page = 1, limit = 50 } = req.query;
    const query = req.query.query || req.query.search;

    const filter = { business: req.business._id };

    // Apply Filters
    if (category) filter.category = new RegExp(category, 'i');
    if (city) filter.city = new RegExp(city, 'i');
    if (rating) filter.rating = { $gte: parseFloat(rating) };
    if (status) filter.status = status;
    if (isFavorite === 'true') filter.isFavorite = true;

    if (hasWebsite === 'true') {
      filter.website = { $ne: '', $exists: true };
    }
    if (hasPhone === 'true') {
      filter.phone = { $ne: '', $exists: true };
    }

    // Keyword search
    if (query) {
      filter.$or = [
        { name: new RegExp(query, 'i') },
        { email: new RegExp(query, 'i') },
        { phone: new RegExp(query, 'i') },
        { address: new RegExp(query, 'i') },
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalLeads = await Lead.countDocuments(filter);

    const leads = await Lead.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: leads.length,
      total: totalLeads,
      totalPages: Math.ceil(totalLeads / parseInt(limit)),
      currentPage: parseInt(page),
      leads,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single lead details
 * @route   GET /api/v1/leads/:id
 * @access  Private
 */
exports.getLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, business: req.business._id });

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    res.status(200).json({ success: true, lead });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create manual lead with duplicate check
 * @route   POST /api/v1/leads
 * @access  Private
 */
exports.createLead = async (req, res, next) => {
  try {
    const { name, phone, email, website, address, rating, category, city, status } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Lead name is required' });
    }

    // Deduplication check
    const duplicateQueryOr = [];
    if (phone && phone.trim() !== '') {
      duplicateQueryOr.push({ phone: phone.trim() });
    }
    if (email && email.trim() !== '') {
      duplicateQueryOr.push({ email: email.trim() });
    }
    if (website && website.trim() !== '') {
      duplicateQueryOr.push({ website: website.trim() });
    }
    if (name && name.trim() !== '') {
      duplicateQueryOr.push({ name: name.trim(), city: city });
    }

    if (duplicateQueryOr.length > 0) {
      const duplicate = await Lead.findOne({
        business: req.business._id,
        $or: duplicateQueryOr
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          error: 'Duplicate Lead: A lead with this name, email, phone, or website already exists in this business.',
        });
      }
    }

    const lead = await Lead.create({
      business: req.business._id,
      name: name.trim(),
      phone: phone ? phone.trim() : '',
      email: email ? email.trim() : '',
      website: website ? website.trim() : '',
      address: address || '',
      rating: rating || 0,
      category: category || '',
      city: city || '',
      status: status || 'New',
      source: 'Manual',
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: 'Lead added successfully!', lead });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update lead details / status
 * @route   PUT /api/v1/leads/:id
 * @access  Private
 */
exports.updateLead = async (req, res, next) => {
  try {
    let lead = await Lead.findOne({ _id: req.params.id, business: req.business._id });

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    // Capture fields
    const fieldsToUpdate = [
      'name',
      'phone',
      'email',
      'website',
      'address',
      'rating',
      'category',
      'city',
      'status',
      'isFavorite',
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        lead[field] = req.body[field];
      }
    });

    lead.updatedAt = Date.now();
    await lead.save();

    res.status(200).json({ success: true, message: 'Lead updated successfully!', lead });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Toggle Lead Favorite Status
 * @route   PATCH /api/v1/leads/:id/favorite
 * @access  Private
 */
exports.toggleFavorite = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, business: req.business._id });
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    lead.isFavorite = !lead.isFavorite;
    await lead.save();

    res.status(200).json({ success: true, isFavorite: lead.isFavorite });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete lead
 * @route   DELETE /api/v1/leads/:id
 * @access  Private
 */
exports.deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOneAndDelete({ _id: req.params.id, business: req.business._id });

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    res.status(200).json({ success: true, message: 'Lead deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Method 1: Search using official Google Places API
 * @route   POST /api/v1/leads/search-places
 * @access  Private
 */
exports.runPlacesSearch = async (req, res, next) => {
  try {
    const { category, city, area, keyword, apiKey, simulate } = req.body;

    if (!category || !city) {
      return res.status(400).json({ success: false, error: 'Category and City are required parameters' });
    }

    // Check if scraper already running for this business
    const status = getJobStatus(req.business._id);
    if (status && status.status === 'running') {
      return res.status(400).json({ success: false, error: 'A scraping job is already running for this business.' });
    }

    // Clear any previous stop request flag
    clearStopRequest(req.business._id);

    const targetCategory = category;
    const targetCity = city;
    const targetArea = area || '';
    const targetKeyword = keyword || '';

    // Build the query parameter for googlePlaces
    const searchString = [targetKeyword, targetCategory].filter(Boolean).join(' ');
    const searchLocation = [targetArea, targetCity].filter(Boolean).join(', ');

    const io = getIO();
    const forceSimulate = simulate === true;

    // Start in background
    (async () => {
      try {
        const { searchGooglePlaces } = require('../services/googlePlaces');
        await searchGooglePlaces(
          searchString,
          searchLocation,
          targetCategory,
          apiKey,
          req.business._id,
          req.user._id,
          io,
          forceSimulate
        );
      } catch (err) {
        console.error('Background Places search failed:', err);
        if (io) {
          io.to(req.business._id.toString()).emit('scraping_log', {
            message: `Places API search encountered an error: ${err.message}`,
            type: 'danger',
            progress: 100,
            timestamp: new Date(),
          });
        }
      }
    })();

    res.status(200).json({
      success: true,
      message: 'Google Places search triggered in background.',
      businessId: req.business._id,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Method 2: Search using Puppeteer Scraper (runs in background)
 * @route   POST /api/v1/leads/scrape-maps
 * @access  Private
 */
exports.runMapsScraper = async (req, res, next) => {
  try {
    const { query, city, category, source, limit } = req.body;

    if (!query || !city || !category) {
      return res.status(400).json({ success: false, error: 'Query, City, and Category are required parameters' });
    }

    // Check if scraper already running for this business
    const status = getJobStatus(req.business._id);
    if (status && status.status === 'running') {
      return res.status(400).json({ success: false, error: 'A scraping job is already running for this business.' });
    }

    const citiesList = city.split(',').map(c => c.trim()).filter(Boolean);
    if (citiesList.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one valid target city is required.' });
    }

    // Clear any previous stop request flag
    clearStopRequest(req.business._id);

    // Start in background
    const io = getIO();
    const scrapeLimitVal = parseInt(limit) || 200;
    
    // We run it as an IIFE so we don't block the HTTP response
    (async () => {
      try {
        const totalCities = citiesList.length;
        
        for (let idx = 0; idx < totalCities; idx++) {
          const currentCity = citiesList[idx];
          
          // Check if stopped before starting next city
          const currentStatus = getJobStatus(req.business._id);
          if (currentStatus?.stopRequested) {
            break;
          }

          // Emit log about current city starting
          if (io) {
            io.to(req.business._id.toString()).emit('scraping_log', {
              message: `[Campaign] Starting city ${idx + 1}/${totalCities}: "${currentCity}"...`,
              type: 'info',
              progress: Math.round((idx / totalCities) * 100),
              timestamp: new Date(),
            });
          }

          // Create wrapper io object to intercept progress and adjust it for the overall campaign!
          const campaignIo = {
            to: (room) => ({
              emit: (event, data) => {
                if (event === 'scraping_log' && io) {
                  // Rescale progress to campaign overall progress
                  // Overall progress: (idx * 100 + data.progress) / totalCities
                  const overallProgress = Math.round((idx * 100 + (data.progress || 0)) / totalCities);
                  io.to(room).emit('scraping_log', {
                    ...data,
                    progress: Math.min(overallProgress, 99), // leave 100 for the final campaign completion
                  });
                } else if (io) {
                  io.to(room).emit(event, data);
                }
              }
            })
          };

          if (source === 'Justdial') {
            await scrapeJustdial(query, currentCity, category, req.business._id, req.user._id, campaignIo, scrapeLimitVal);
          } else if (source === 'IndiaMart') {
            await scrapeIndiaMart(query, currentCity, category, req.business._id, req.user._id, campaignIo, scrapeLimitVal);
          } else if (source === 'Yellow Pages') {
            await scrapeYellowPages(query, currentCity, category, req.business._id, req.user._id, campaignIo, scrapeLimitVal);
          } else {
            await scrapeGoogleMaps(query, currentCity, category, req.business._id, req.user._id, campaignIo, scrapeLimitVal);
          }
        }

        // Final completion event
        if (io) {
          io.to(req.business._id.toString()).emit('scraping_log', {
            message: `Campaign complete! Successfully searched all targets: [${citiesList.join(', ')}].`,
            type: 'success',
            progress: 100,
            timestamp: new Date(),
          });
        }
      } catch (err) {
        console.error('Background scraper failed:', err);
        if (io) {
          io.to(req.business._id.toString()).emit('scraping_log', {
            message: `Campaign encountered an error: ${err.message}`,
            type: 'danger',
            progress: 100,
            timestamp: new Date(),
          });
        }
      }
    })();

    res.status(200).json({
      success: true,
      message: 'Multi-city campaign scraper triggered in background.',
      businessId: req.business._id,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Stop background scraper job
 * @route   POST /api/v1/leads/scrape-stop
 * @access  Private
 */
exports.stopMapsScraper = async (req, res, next) => {
  try {
    const stopped = requestStopJob(req.business._id);
    
    if (stopped) {
      const io = getIO();
      if (io) {
        io.to(req.business._id.toString()).emit('scraping_log', {
          message: 'Scraping stopped by user request.',
          type: 'warning',
          progress: 100,
          timestamp: new Date(),
        });
      }
      res.status(200).json({ success: true, message: 'Scraper stop command dispatched.' });
    } else {
      res.status(400).json({ success: false, error: 'No active scraping job found for this business.' });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get background scraper status
 * @route   GET /api/v1/leads/scrape-status
 * @access  Private
 */
exports.getScraperStatus = async (req, res, next) => {
  try {
    const status = getJobStatus(req.business._id);
    res.status(200).json({
      success: true,
      job: status ? { status: status.status, stopRequested: status.stopRequested } : null,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Enrich a single lead using Gemini AI
 * @route   POST /api/v1/leads/:id/ai-enrich
 * @access  Private
 */
exports.enrichSingleLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, business: req.business._id });
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const { enrichLeadWithAI } = require('../services/geminiService');
    const enrichedData = await enrichLeadWithAI(lead, req.business.aiContext);

    lead.ownerName = enrichedData.ownerName || lead.ownerName;
    lead.aiScore = enrichedData.aiScore || lead.aiScore;
    lead.aiAnalysis = enrichedData.aiAnalysis || lead.aiAnalysis;
    lead.aiEnriched = true;
    if (enrichedData.email && !lead.email) {
      lead.email = enrichedData.email;
    }
    if (enrichedData.phone && (!lead.phone || lead.phone.trim() === '' || lead.phone.includes('No phone'))) {
      lead.phone = enrichedData.phone;
    }

    await lead.save();

    res.status(200).json({
      success: true,
      message: 'Lead enriched successfully using Gemini AI.',
      data: lead
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Generate customized cold outreach pitch using Gemini AI
 * @route   GET /api/v1/leads/:id/ai-pitch
 * @access  Private
 */
exports.generateLeadPitch = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, business: req.business._id });
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const { type = 'whatsapp' } = req.query;
    const { generateOutreachPitch } = require('../services/geminiService');
    const pitch = await generateOutreachPitch(lead, type, req.business.aiContext, req.business.name);

    res.status(200).json({
      success: true,
      data: pitch
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Bulk enrich multiple leads using Gemini AI
 * @route   POST /api/v1/leads/bulk-enrich
 * @access  Private
 */
exports.bulkEnrichLeads = async (req, res, next) => {
  try {
    const { leadIds } = req.body;
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Lead IDs are required for bulk enrichment' });
    }

    const { enrichLeadWithAI } = require('../services/geminiService');
    const enrichedResults = [];

    // Process them sequentially to avoid Gemini API rate limits
    for (const id of leadIds) {
      try {
        const lead = await Lead.findOne({ _id: id, business: req.business._id });
        if (!lead || lead.aiEnriched) continue;

        const enrichedData = await enrichLeadWithAI(lead, req.business.aiContext);

        lead.ownerName = enrichedData.ownerName || lead.ownerName;
        lead.aiScore = enrichedData.aiScore || lead.aiScore;
        lead.aiAnalysis = enrichedData.aiAnalysis || lead.aiAnalysis;
        lead.aiEnriched = true;
        if (enrichedData.email && !lead.email) {
          lead.email = enrichedData.email;
        }
        if (enrichedData.phone && (!lead.phone || lead.phone.trim() === '' || lead.phone.includes('No phone'))) {
          lead.phone = enrichedData.phone;
        }

        await lead.save();
        enrichedResults.push(lead);
      } catch (err) {
        console.error(`Error enriching lead ${id} in bulk operation:`, err.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully enriched ${enrichedResults.length} leads in bulk.`,
      count: enrichedResults.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Import multiple leads from CSV
 * @route   POST /api/v1/leads/import
 * @access  Private
 */
exports.importLeads = async (req, res, next) => {
  try {
    const { leads } = req.body;
    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ success: false, error: 'No lead data provided for import' });
    }

    let importedCount = 0;
    let duplicateCount = 0;

    for (const item of leads) {
      try {
        if (!item.name) continue;

        // Check duplicate
        const dupQuery = [];
        if (item.phone && String(item.phone).trim() !== '') dupQuery.push({ phone: String(item.phone).trim() });
        if (item.website && String(item.website).trim() !== '') dupQuery.push({ website: String(item.website).trim() });
        if (item.name && String(item.name).trim() !== '') dupQuery.push({ name: String(item.name).trim(), city: item.city || '' });

        let exists = null;
        if (dupQuery.length > 0) {
          exists = await Lead.findOne({
            business: req.business._id,
            $or: dupQuery,
          });
        }

        if (exists) {
          duplicateCount++;
          continue;
        }

        const newLead = new Lead({
          business: req.business._id,
          name: item.name,
          phone: item.phone || '',
          email: item.email || '',
          website: item.website || '',
          address: item.address || `${item.category || 'Prospect'} in ${item.city || 'local'}`,
          rating: parseFloat(item.rating) || 0,
          reviewsCount: parseInt(item.reviewsCount) || 0,
          category: item.category || '',
          city: item.city || '',
          mapsUrl: item.mapsUrl || '',
          source: item.source || 'CSV Import',
          createdBy: req.user._id,
        });

        await newLead.save();
        importedCount++;
      } catch (err) {
        console.error('Error saving imported lead:', err.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Import complete! Successfully imported ${importedCount} leads. Found ${duplicateCount} duplicates.`,
      importedCount,
      duplicateCount,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Bulk delete multiple leads
 * @route   POST /api/v1/leads/bulk-delete
 * @access  Private
 */
exports.bulkDeleteLeads = async (req, res, next) => {
  try {
    const { leadIds } = req.body;
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Lead IDs are required for bulk deletion' });
    }

    const result = await Lead.deleteMany({
      _id: { $in: leadIds },
      business: req.business._id,
    });

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} leads.`,
      count: result.deletedCount,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Bulk update status of multiple leads
 * @route   POST /api/v1/leads/bulk-status
 * @access  Private
 */
exports.bulkUpdateStatus = async (req, res, next) => {
  try {
    const { leadIds, status } = req.body;
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Lead IDs are required' });
    }
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status value is required' });
    }

    const result = await Lead.updateMany(
      { _id: { $in: leadIds }, business: req.business._id },
      { $set: { status, updatedAt: Date.now() } }
    );

    res.status(200).json({
      success: true,
      message: `Successfully updated status to "${status}" for ${result.modifiedCount} leads.`,
      count: result.modifiedCount,
    });
  } catch (err) {
    next(err);
  }
};
