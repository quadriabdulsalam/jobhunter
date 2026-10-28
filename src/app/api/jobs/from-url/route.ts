import { NextResponse } from 'next/server';
import { getMasterProfile, saveTailoredCV, upsertJob } from '@/lib/storage';
import { JobPosting } from '@/lib/types';
import { getStorageContext } from '@/lib/supabase-server';
import { tailorCVForJob } from '@/lib/cv-tailorer';

export async function POST(req: Request) {
  try {
    const context = await getStorageContext();
    const { url, autoTailor } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Please provide a valid LinkedIn job URL.'
      }, { status: 400 });
    }

    // Extract Job ID if present
    const idMatch = url.match(/\/jobs\/view\/(\d+)/) || url.match(/currentJobId=(\d+)/) || url.match(/(\d{8,12})/);
    const jobId = idMatch ? `li-${idMatch[1]}` : `job-${Date.now()}`;

    // Normalize URL to direct public view URL if possible
    const fetchUrl = idMatch ? `https://www.linkedin.com/jobs/view/${idMatch[1]}` : url;

    let title = '';
    let company = '';
    let location = 'Remote / Hybrid';
    let description = '';

    try {
      // Fetch public HTML with browser-like headers
      const res = await fetch(fetchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });

      if (res.ok) {
        const html = await res.text();

        // 1. Try JSON-LD Schema
        const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
        if (jsonLdMatch) {
          try {
            const schema = JSON.parse(jsonLdMatch[1]);
            if (schema['@type'] === 'JobPosting' || schema.title) {
              title = schema.title || title;
              company = schema.hiringOrganization?.name || company;
              location = schema.jobLocation?.address?.addressLocality || location;
              description = (schema.description || '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            }
          } catch {
            // fallback to regex extraction
          }
        }

        // 2. Fallback to OpenGraph meta tags
        if (!title) {
          const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
          if (ogTitleMatch) {
            const rawTitle = ogTitleMatch[1];
            // Usually formatted as "Company hiring Job Title in Location..."
            title = rawTitle.replace(/ hiring .*$/i, '').trim();
            if (rawTitle.includes(' hiring ')) {
              const parts = rawTitle.split(' hiring ');
              company = parts[0].trim();
              title = parts[1].split(' in ')[0].trim();
            }
          }
        }

        if (!description) {
          const ogDescMatch = html.match(/<meta property="og:description" content="([^"]+)"/i) ||
                                html.match(/<meta name="description" content="([^"]+)"/i);
          if (ogDescMatch) {
            description = ogDescMatch[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim();
          }
        }

        // 3. Extract description container if present
        const descHtmlMatch = html.match(/<div class="show-more-less-html__markup[^>]*>([\s\S]*?)<\/div>/i);
        if (descHtmlMatch) {
          description = descHtmlMatch[1]
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<li[^>]*>/gi, '• ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .trim();
        }
      }
    } catch (fetchErr) {
      console.warn('Could not fetch LinkedIn public page directly:', fetchErr);
    }

    // If title is still missing, fallback to clean placeholders
    if (!title) {
      title = idMatch ? `LinkedIn Job #${idMatch[1]}` : 'Imported LinkedIn Role';
    }
    if (!description || description.length < 30) {
      description = `Job listing imported from ${url}. Review and refine requirements or paste full text.`;
    }

    const job: JobPosting = {
      id: jobId,
      title,
      company: company || 'LinkedIn Employer',
      location,
      url,
      source: 'linkedin',
      applyType: 'easy_apply',
      description,
      extractedAt: new Date().toISOString(),
      status: 'extracted'
    };

    const savedJob = await upsertJob(context, job);

    let tailoredCv = null;
    if (autoTailor) {
      const profile = await getMasterProfile(context);
      if (profile) {
        tailoredCv = await tailorCVForJob(profile, savedJob);
        await saveTailoredCV(context, tailoredCv);
        savedJob.tailoredCvId = tailoredCv.id;
        savedJob.status = 'tailored';
        savedJob.matchScore = tailoredCv.matchScore;
        await upsertJob(context, savedJob);
      }
    }

    return NextResponse.json({
      success: true,
      job: savedJob,
      tailoredCv
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error fetching job from URL:', errorMsg);
    return NextResponse.json({
      success: false,
      error: errorMsg
    }, { status: 500 });
  }
}
