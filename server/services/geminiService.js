const axios = require('axios');
const cheerio = require('cheerio');

// Helper to fetch website content text
const fetchWebsiteText = async (url) => {
  if (!url) return '';
  let formattedUrl = url.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = `https://${formattedUrl}`;
  }

  try {
    const res = await axios.get(formattedUrl, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const $ = cheerio.load(res.data);
    
    // Remove scripts and style tags
    $('script, style, iframe, noscript').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    return text.slice(0, 4000); // Send first 4000 characters to Gemini
  } catch (err) {
    if (formattedUrl.startsWith('https://')) {
      try {
        const httpUrl = formattedUrl.replace('https://', 'http://');
        const res = await axios.get(httpUrl, {
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        const $ = cheerio.load(res.data);
        $('script, style, iframe, noscript').remove();
        const text = $('body').text().replace(/\s+/g, ' ').trim();
        return text.slice(0, 4000);
      } catch (innerErr) {
        return '';
      }
    }
    return '';
  }
};

/**
 * Sends a prompt to the Gemini API and parses the response
 */
const queryGemini = async (prompt, isJson = false) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please add it to your Settings.');
  }

  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-1.0-pro'
  ];

  let lastError = null;

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };

    if (isJson) {
      if (model.includes('1.5') || model === 'gemini-2.0-flash') {
        payload.generationConfig = {
          responseMimeType: "application/json"
        };
      }
    }

    try {
      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000
      });

      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return response.data.candidates[0].content.parts[0].text;
      }
    } catch (err) {
      console.warn(`Gemini call failed for model ${model}: ${err.message}`);
      lastError = err;
      continue; // try next model
    }
  }
  
  throw new Error(lastError ? `Gemini API failed: ${lastError.message}` : 'Failed to get response from Gemini API');
};

/**
 * Enrich lead data using Gemini
 */
exports.enrichLeadWithAI = async (lead, aiContext) => {
  let websiteText = '';
  if (lead.website) {
    websiteText = await fetchWebsiteText(lead.website);
  }

  const prompt = `
  You are an expert lead generation auditor.
  Analyze this lead data and website context, then provide a JSON object back.

  Our company offering context:
  ${aiContext || 'We build premium websites, improve Google Maps SEO, and integrate automatic WhatsApp review boosters.'}

  Lead Details:
  - Name: ${lead.name}
  - Category: ${lead.category}
  - City: ${lead.city}
  - Rating: ${lead.rating} ★ (${lead.reviewsCount || 0} reviews)
  - Current Phone: ${lead.phone || 'None'}
  - Current Email: ${lead.email || 'None'}
  - Current Website: ${lead.website || 'None'}

  Website content preview (first 4000 characters):
  ${websiteText || 'No website content available.'}

  Your tasks:
  1. Identify the Owner, Founder, or Manager name if visible on the site.
  2. Determine the conversion quality score for our services ('High', 'Medium', or 'Low').
     - Assign 'High' if they have a website but it lacks modern designs/mobile optimization or has poor Google ratings (below 4.2), OR if they have NO website.
     - Assign 'Medium' if they have a decent website/rating but can benefit from advanced SEO, CRM integration, or automations.
     - Assign 'Low' if they are already fully optimized.
  3. Write a brief summary analysis (maximum 3 sentences) in Marathi or bilingual (English + Marathi) recommending exactly what services we should pitch to them based on our offering context.
  4. Find any direct sales or contact emails from the website content.
  5. Find any business phone numbers or WhatsApp numbers from the website content if their current phone is missing or generic.

  You MUST return ONLY a valid JSON object matching this schema:
  {
    "ownerName": "extracted owner name or empty string",
    "aiScore": "High" or "Medium" or "Low",
    "aiAnalysis": "Bilingual Marathi/English pitch recommendation summary based on our offering",
    "email": "extracted contact email or empty string",
    "phone": "extracted contact phone or empty string"
  }
  `;

  try {
    const rawResponse = await queryGemini(prompt, true);
    const result = JSON.parse(rawResponse);
    return {
      ownerName: result.ownerName || '',
      aiScore: result.aiScore || 'Medium',
      aiAnalysis: result.aiAnalysis || 'No analysis available.',
      email: result.email || '',
      phone: result.phone || ''
    };
  } catch (err) {
    console.error('Gemini enrichment error:', err);
    return {
      ownerName: '',
      aiScore: 'Medium',
      aiAnalysis: 'AI analysis failed to execute: ' + err.message,
      email: '',
      phone: ''
    };
  }
};

/**
 * Generate high-converting outreach message
 */
exports.generateOutreachPitch = async (lead, type = 'whatsapp', aiContext, businessName) => {
  const prompt = `
  You are a professional salesperson pitching digital services for a company named "${businessName || 'Codeitz'}".
  Write a high-converting, friendly, and persuasive outreach message for this business lead.
  
  Our company services & offer details:
  ${aiContext || 'We build premium websites, improve Google Maps SEO, and integrate automatic WhatsApp review boosters.'}

  Lead Details:
  - Name: ${lead.name}
  - Category: ${lead.category}
  - City: ${lead.city}
  - Rating: ${lead.rating} ★
  - Owner/Contact Name: ${lead.ownerName || 'Sir/Madam'}
  - Recommendation audit: ${lead.aiAnalysis || 'Needs modern website/marketing boost'}
  
  Pitch Type: ${type === 'whatsapp' ? 'WhatsApp Message (concise, uses emojis, calls to action)' : 'Cold Email (professional, descriptive, clear subject line)'}

  Language: Write the message in friendly, conversational bilingual format (Bilingual English + Marathi or English + Hindi). It should feel warm, localized, and highly professional. Focus the message strictly on how our company services can help increase their customers. Do NOT use placeholders in the message; output the ready-to-send text.
  `;

  try {
    const pitch = await queryGemini(prompt, false);
    return pitch.trim();
  } catch (err) {
    console.error('Gemini pitch generation error:', err);
    return `Hello ${lead.name} Team, we would love to connect with you regarding upgrading your business presence. (Error generating AI Pitch: ${err.message})`;
  }
};
